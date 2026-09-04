import { NextRequest, NextResponse } from "next/server";
import { ControlledAgentTools } from "@/services/agentTools";
import { 
  analyzeUserRequirements, 
  rankProducts, 
  generateRecommendationExplanation, 
  RankedRecommendation 
} from "@/services/recommendationService";
import { auditService } from "@/services/auditService";
import { getAllProducts, getProductById } from "@/services/catalogService";
import { getCrossSellForProduct } from "@/services/offersService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId = "sess_" + Date.now().toString(36) } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    const tools = new ControlledAgentTools(sessionId);
    const reasoningSteps: string[] = [];

    // 1. Log User Request in Audit Trail
    auditService.logEvent({
      sessionId,
      actor: "USER",
      action: "USER_REQUEST",
      reason: message.trim(),
      metadata: { rawInput: message },
      status: "SUCCESS"
    });
    reasoningSteps.push("Understanding shopping intent & constraints");

    // 2. Extract Intent (Category, Budget, Desired Features, Use Case)
    const requirements = analyzeUserRequirements(message);
    auditService.logEvent({
      sessionId,
      actor: "AI_AGENT",
      action: "AI_INTENT_PARSED",
      reason: `Extracted intent: Category=${requirements.category || "Any"}, Budget=${requirements.budget || "Any"}, UseCase=${requirements.useCase || "General"}`,
      metadata: { requirements },
      status: "SUCCESS"
    });

    // 3. Controlled Tool Call: searchProducts
    reasoningSteps.push(`Searching catalog for ${requirements.category || "electronic"} products`);
    const matchedProducts = tools.searchProducts({
      category: requirements.category,
      maxPrice: requirements.budget,
      requiredFeatures: requirements.desiredFeatures,
      query: requirements.preferredBrand
    });

    // Handle No Matches / Unrealistic budget gracefully
    if (matchedProducts.length === 0) {
      reasoningSteps.push("No exact match within criteria; exploring closest alternatives");
      // Fallback to broader category search
      const fallbackProducts = tools.searchProducts({
        category: requirements.category
      });

      const replyText = requirements.budget
        ? `I couldn't find any ${requirements.category || "products"} under your budget of ₹${requirements.budget.toLocaleString('en-IN')}. However, here are the closest high-rated options from our catalog:`
        : `I couldn't find any products matching your exact specifications. Here are popular alternatives available in our store:`;

      return NextResponse.json({
        success: true,
        reply: replyText,
        reasoningSteps,
        recommendation: null,
        products: fallbackProducts.slice(0, 3),
        suggestedPrompts: [
          "Show headphones under ₹5000",
          "Find best rated earbuds",
          "Show travel headphones with ANC"
        ]
      });
    }

    // 4. Controlled Tool Call: checkStock on matches
    reasoningSteps.push(`Checking inventory stock for ${matchedProducts.length} candidate item(s)`);
    for (const p of matchedProducts.slice(0, 4)) {
      tools.checkStock(p.id);
    }

    // 5. Intelligent Multi-Factor Scoring & Ranking
    reasoningSteps.push("Evaluating 6-factor score (budget, features, availability, rating, use case, value)");
    const ranked = rankProducts(matchedProducts, requirements);
    const recommendation: RankedRecommendation | null = generateRecommendationExplanation(ranked, requirements);

    // 6. Controlled Tool Call: compareProducts if 2 or more candidates exist
    let comparisonData = null;
    if (ranked.length >= 2) {
      reasoningSteps.push("Generating comparative specification matrix");
      const compareIds = ranked.slice(0, 3).map(r => r.product.id);
      comparisonData = tools.compareProducts(compareIds);
    }

    // 7. Log Recommendation in Audit Trail
    if (recommendation) {
      auditService.logEvent({
        sessionId,
        actor: "AI_AGENT",
        action: "PRODUCT_RECOMMENDED",
        reason: `Recommended ${recommendation.bestMatch.name} (Score: ${recommendation.bestMatchScore.overallScore}/100)`,
        metadata: {
          productId: recommendation.bestMatch.id,
          score: recommendation.bestMatchScore,
          reasons: recommendation.explanation.reasons
        },
        status: "SUCCESS"
      });
    }

    // Formulate final natural language message (strictly from actual product data)
    let replyMessage = "";
    if (recommendation) {
      const p = recommendation.bestMatch;
      const budgetNote = requirements.budget ? ` within your ₹${requirements.budget.toLocaleString('en-IN')} budget` : "";
      const useCaseNote = requirements.useCase ? ` for ${requirements.useCase}` : "";
      replyMessage = `I recommend the **${p.name}** (${p.brand}) because it best matches your requirements${budgetNote}${useCaseNote}.\n\nIt features **${p.features.slice(0, 3).join(", ")}**, is rated **${p.rating}★**, and has **${p.stock} units in stock** with **${p.delivery_days}-day delivery**.`;
    } else {
      replyMessage = `Here are the best matching products found in the catalog:`;
    }

    // Check for bundle / cross-sell opportunities
    let crossSell = null;
    if (recommendation?.bestMatch) {
      const rule = getCrossSellForProduct(recommendation.bestMatch.id);
      if (rule && rule.accessories?.length) {
        const resolvedAccessories = rule.accessories
          .map((acc: any) => ({
            accessoryId: acc.accessoryId,
            reason: acc.reason,
            product: getProductById(acc.accessoryId) || null
          }))
          .filter((acc: any) => acc.product !== null);

        if (resolvedAccessories.length > 0) {
          crossSell = {
            mainProduct: recommendation.bestMatch,
            accessories: resolvedAccessories,
            bundleDiscountPercent: rule.bundleDiscountPercent || 10
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      reply: replyMessage,
      reasoningSteps,
      recommendation,
      comparison: comparisonData,
      crossSell,
      allMatchedProducts: ranked.map(r => r.product),
      suggestedPrompts: [
        `Buy ${recommendation?.bestMatch.name || "Best Match"}`,
        "Compare top 3 options",
        "Show ANC headphones with long battery life",
        "Test spending bound above ₹5000"
      ]
    });

  } catch (error: any) {
    console.error("[chat API error]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process chat message",
        details: error.message
      },
      { status: 500 }
    );
  }
}
