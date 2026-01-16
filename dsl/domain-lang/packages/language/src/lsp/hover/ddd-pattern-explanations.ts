/**
 * DDD Pattern Explanations for Hover Documentation
 * 
 * Provides plain-English explanations for DDD integration patterns,
 * relationship types, and decision categories.
 */

/**
 * Explanations for DDD integration role patterns (e.g., PL, ACL, SK).
 */
export const rolePatternExplanations: Record<string, string> = {
    'PL': `**Published Language (PL)**

The upstream context provides a well-documented, stable API/model that downstream contexts consume.

\`\`\`domain-lang
[PL] UpstreamContext -> DownstreamContext
\`\`\`

*Use when:* Multiple consumers need a shared, stable interface.`,
    
    'ACL': `**Anti-Corruption Layer (ACL)**

Protects downstream from upstream changes by translating between models.

\`\`\`domain-lang
UpstreamContext -> [ACL] DownstreamContext
\`\`\`

*Use when:* You don't trust upstream stability or want isolation.`,
    
    'SK': `**Shared Kernel (SK)**

Both contexts share common domain model code requiring coordination.

\`\`\`domain-lang
[SK] Context1 <-> [SK] Context2 : SharedKernel
\`\`\`

*Use when:* Contexts are tightly coupled and teams can coordinate.`,
    
    'CF': `**Conformist (CF)**

Downstream accepts upstream model without translation.

\`\`\`domain-lang
UpstreamContext -> [CF] DownstreamContext
\`\`\`

*Use when:* Upstream model is acceptable and translation isn't worth it.`,
    
    'OHS': `**Open Host Service (OHS)**

Upstream defines a protocol/API for easy integration.

\`\`\`domain-lang
[OHS, PL] ApiContext -> ConsumerContext
\`\`\`

*Use when:* Multiple downstream contexts need integration.`,
    
    'P': `**Partnership (P)**

Teams coordinate development and align releases.

\`\`\`domain-lang
Context1 <-> Context2 : Partnership
\`\`\`

*Use when:* Mutual success dependency exists.`,
    
    'BBoM': `**Big Ball of Mud (BBoM)**

No clear boundaries - tangled models needing refactoring.

\`\`\`domain-lang
[BBoM] LegacySystem -> ModernContext
\`\`\`

*Use when:* Documenting legacy systems.`
};

/**
 * Explanations for relationship types (e.g., Partnership, CustomerSupplier).
 */
export const relationshipTypeExplanations: Record<string, string> = {
    'Partnership': '**Partnership**\n\nTwo contexts with mutual success dependency. Teams plan together and coordinate releases.\n\n*Example:* Sales and Order Fulfillment contexts that must evolve in sync.',
    
    'SharedKernel': '**Shared Kernel**\n\nTwo contexts share a subset of code/model. Changes require agreement from both teams.\n\n*Example:* Two closely related contexts sharing common domain entities.',
    
    'CustomerSupplier': '**Customer/Supplier**\n\nDownstream (customer) context depends on upstream (supplier) context. Supplier meets customer\'s needs through negotiation.\n\n*Example:* Payment context (customer) depends on Billing context (supplier).',
    
    'UpstreamDownstream': '**Upstream/Downstream**\n\nUpstream context influences downstream context, but not vice versa. Downstream adapts to upstream changes.\n\n*Example:* Inventory (upstream) provides data to Reporting (downstream).',
    
    'SeparateWays': '**Separate Ways**\n\nNo connection between contexts - they duplicate functionality rather than integrate.\n\n*Use when:* Integration cost exceeds benefit of sharing.'
};

/**
 * Explanations for relationship arrows.
 */
export const arrowExplanations: Record<string, string> = {
    '<->': 'Bidirectional relationship - both contexts influence each other',
    '->': 'Downstream dependency - right depends on left (left is upstream)',
    '<-': 'Upstream dependency - left depends on right (right is upstream)',
    '><': 'Separate Ways - no integration between contexts',
    'U/D': 'Upstream/Downstream - shorthand for upstream → downstream flow',
    'u/d': 'Upstream/Downstream - shorthand for upstream → downstream flow',
    'C/S': 'Customer/Supplier - shorthand for customer ← supplier relationship',
    'c/s': 'Customer/Supplier - shorthand for customer ← supplier relationship'
};

/**
 * Explanations for decision categories.
 */
export const decisionCategoryExplanations: Record<string, string> = {
    'architectural': '**Architectural Decision**\n\nConcerns system structure, technology choices, or cross-cutting patterns.\n\n*Examples:* Microservices vs monolith, event sourcing, CQRS',
    'arch': 'Short for "architectural" - concerns system structure and technology choices',
    
    'business': '**Business Decision**\n\nConcerns business rules, policies, or domain logic.\n\n*Examples:* Pricing rules, refund policies, eligibility criteria',
    'biz': 'Short for "business" - concerns business rules and domain logic',
    
    'technical': '**Technical Decision**\n\nConcerns implementation details, algorithms, or technical constraints.\n\n*Examples:* Caching strategy, data structures, optimization approach',
    'tech': 'Short for "technical" - concerns implementation details',
    
    'compliance': '**Compliance Decision**\n\nConcerns legal, regulatory, or compliance requirements.\n\n*Examples:* GDPR data retention, SOX audit trails, HIPAA privacy',
    
    'security': '**Security Decision**\n\nConcerns security, authentication, authorization, or data protection.\n\n*Examples:* OAuth vs JWT, encryption at rest, access control',
    
    'operational': '**Operational Decision**\n\nConcerns deployment, monitoring, or operational procedures.\n\n*Examples:* Blue/green deployment, monitoring strategy, backup policy',
    'ops': 'Short for "operational" - concerns deployment and operations'
};

/**
 * Explanations for common DDD classifications.
 */
export const classificationExplanations: Record<string, string> = {
    'Core': '**Core Domain**\n\nThe primary differentiator for your business - this is where you create unique value.\n\n*Invest heavily:* Best team, careful design, deep modeling.\n\n*Example:* Recommendation engine for Netflix, search for Google',
    
    'Supporting': '**Supporting Subdomain**\n\nNecessary for the business but not a differentiator. Custom implementation needed but not the main focus.\n\n*Invest moderately:* Good team, solid implementation.\n\n*Example:* Inventory management, invoicing',
    
    'Generic': '**Generic Subdomain**\n\nSolved problem - could use off-the-shelf solution. No competitive advantage.\n\n*Buy or reuse:* Use existing solutions when possible.\n\n*Example:* User authentication, email sending, payment processing',
    
    'Strategic': '**Strategic** (Wardley Evolution)\n\nNovel, custom-built, competitive advantage. High value, low maturity.\n\n*Similar to Core Domain.*',
    
    'Custom': '**Custom-Built** (Wardley Evolution)\n\nSpecialized solution, some precedent exists. Medium-high value, medium maturity.',
    
    'Product': '**Product/Rental** (Wardley Evolution)\n\nStandardized product with features. Medium value, medium-high maturity.\n\n*Example:* SaaS tools, commercial software',
    
    'Commodity': '**Commodity/Utility** (Wardley Evolution)\n\nUbiquitous, interchangeable, fully standardized. Low value, high maturity.\n\n*Example:* Cloud compute, email services'
};

/**
 * Get explanation for a role pattern.
 */
export function explainRolePattern(role: string): string | undefined {
    return rolePatternExplanations[role];
}

/**
 * Get explanation for a relationship type.
 */
export function explainRelationshipType(type: string): string | undefined {
    return relationshipTypeExplanations[type];
}

/**
 * Get explanation for an arrow symbol.
 */
export function explainArrow(arrow: string): string | undefined {
    return arrowExplanations[arrow];
}

/**
 * Get explanation for a decision category.
 */
export function explainDecisionCategory(category: string): string | undefined {
    return decisionCategoryExplanations[category];
}

/**
 * Get explanation for a classification.
 */
export function explainClassification(name: string): string | undefined {
    return classificationExplanations[name];
}

/**
 * Generate relationship explanation from roles and type.
 */
export function generateRelationshipExplanation(
    leftRoles: string[] | undefined,
    arrow: string | undefined,
    rightRoles: string[] | undefined,
    type: string | undefined
): string {
    const parts: string[] = [];
    
    // Arrow explanation
    if (arrow) {
        const arrowExp = explainArrow(arrow);
        if (arrowExp) {
            parts.push(`**Arrow:** ${arrowExp}`);
        }
    }
    
    // Left roles
    if (leftRoles && leftRoles.length > 0) {
        parts.push('**Left Context Patterns:**');
        leftRoles.forEach(role => {
            const exp = explainRolePattern(role);
            if (exp) {
                parts.push(exp);
            }
        });
    }
    
    // Right roles
    if (rightRoles && rightRoles.length > 0) {
        parts.push('**Right Context Patterns:**');
        rightRoles.forEach(role => {
            const exp = explainRolePattern(role);
            if (exp) {
                parts.push(exp);
            }
        });
    }
    
    // Relationship type
    if (type) {
        const typeExp = explainRelationshipType(type);
        if (typeExp) {
            parts.push(typeExp);
        }
    }
    
    return parts.join('\n\n---\n\n');
}
