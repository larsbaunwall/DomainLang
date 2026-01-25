# Banking System

A comprehensive banking domain demonstrating real-world DomainLang usage with regulatory compliance, fraud detection, and complex integration patterns.

## Overview

This example models a banking system with:
- Multi-level domain hierarchy (Banking → CustomerAccounts, Payments, Compliance)
- Strategic classifications including regulatory requirements
- Rich terminology for financial concepts
- Complex integration patterns between bounded contexts

## The Model

```dlang
// ============================================================================
// Strategic Classifications
// ============================================================================

Classification CoreDomain
Classification SupportingDomain
Classification GenericDomain

Classification HighlyRegulated
Classification MissionCritical

// BC Canvas: Evolution stage (from Wardley Maps)
Classification Commodity
Classification Product

// BC Canvas: Archetype (domain role)
Classification Execution
Classification Gateway

// ============================================================================
// Teams
// ============================================================================

Team CoreBankingTeam
Team PaymentsTeam
Team ComplianceTeam
Team CustomerServiceTeam
Team FraudDetectionTeam

// ============================================================================
// Domain Hierarchy
// ============================================================================

Domain Banking {
    description: "Core banking operations and services"
    vision: "Provide secure, reliable, and compliant banking services"
    type: CoreDomain
}

Domain CustomerAccounts in Banking {
    description: "Customer account management and transactions"
    type: CoreDomain
}

Domain Payments in Banking {
    description: "Payment processing and transfers"
    type: CoreDomain
}

Domain Compliance in Banking {
    description: "Regulatory compliance and reporting"
    type: SupportingDomain
}

// ============================================================================
// Core Banking Contexts
// ============================================================================

bc AccountManagement for CustomerAccounts
    as CoreDomain
    by CoreBankingTeam {

    description: "Manages customer accounts, balances, and account lifecycle"

    archetype: Execution
    evolution: Commodity

    terminology {
        term Account: "Customer financial account"
            aka BankAccount, CustomerAccount
            examples "Checking Account #123456", "Savings Account #789012"

        term AccountHolder: "Person or entity owning the account"
            aka Customer, AccountOwner

        term Balance: "Current amount of money in account"
            aka AccountBalance, AvailableFunds

        term Transaction: "Financial operation affecting account balance"
            aka BankTransaction, Operation
            examples "Deposit $500", "Withdrawal $200", "Transfer $1000"

        term AccountStatus: "Current state of account"
            examples "Active", "Frozen", "Closed", "Dormant"
    }

    decisions {
        decision [HighlyRegulated] EventSourcing:
            "Use event sourcing to maintain complete transaction history"

        decision [MissionCritical] PostgreSQL:
            "Use PostgreSQL for ACID transaction guarantees"

        policy NegativeBalanceProhibited:
            "Prevent overdrafts without overdraft protection"
    }
}

bc PaymentProcessing for Payments
    as CoreDomain
    by PaymentsTeam {

    description: "Processes all payment types including transfers and bill pay"

    terminology {
        term Payment: "Transfer of money from one account to another"
            examples "Wire transfer", "ACH payment", "Bill payment"

        term PaymentStatus: "Current state of payment processing"
            examples "Pending", "Processed", "Failed", "Reversed"
    }

    relationships {
        [OHS] this -> [CF] AccountManagement
    }
}

bc FraudDetection for Compliance
    as SupportingDomain
    by FraudDetectionTeam {

    description: "Detects and prevents fraudulent transactions"

    terminology {
        term FraudAlert: "Notification of suspicious activity"
        term RiskScore: "Calculated probability of fraud"
    }

    relationships {
        [ACL] this <- PaymentProcessing
    }
}

// ============================================================================
// Context Map
// ============================================================================

ContextMap BankingSystem {
    contains AccountManagement, PaymentProcessing, FraudDetection

    [OHS] PaymentProcessing -> [CF] AccountManagement
    [OHS] PaymentProcessing -> [ACL] FraudDetection
}
```

## Key Patterns Demonstrated

### Domain Hierarchy

The banking domain is organized hierarchically using `in`:

```dlang
Domain Banking { }
Domain CustomerAccounts in Banking { }
Domain Payments in Banking { }
Domain Compliance in Banking { }
```

### Regulatory Classifications

Custom classifications capture regulatory requirements:

```dlang
Classification HighlyRegulated
Classification MissionCritical

decisions {
    decision [HighlyRegulated] EventSourcing: "..."
}
```

### Rich Terminology

Financial terminology with aliases and examples:

```dlang
terminology {
    term Account: "Customer financial account"
        aka BankAccount, CustomerAccount
        examples "Checking Account #123456"
}
```

### Integration Patterns

The context map shows upstream/downstream relationships:

```dlang
[OHS] PaymentProcessing -> [CF] AccountManagement
[OHS] PaymentProcessing -> [ACL] FraudDetection
```

- PaymentProcessing provides an Open Host Service
- AccountManagement conforms to the payment API
- FraudDetection uses an Anti-Corruption Layer to protect its model

## Full Example

View the complete banking system example in the repository:

[banking-system.dlang on GitHub](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/examples/banking-system.dlang)
