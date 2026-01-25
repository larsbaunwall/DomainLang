# Healthcare System

A hospital management system demonstrating DomainLang for clinical care, patient records, HIPAA compliance, and pharmacy management.

## Overview

This example models a healthcare system with:

- Clinical and administrative domain separation
- HIPAA compliance and patient safety classifications
- Rich medical terminology (diagnoses, encounters, treatments)
- Integration between clinical, administrative, and pharmacy contexts

## The Model

```dlang
// ============================================================================
// Strategic Classifications
// ============================================================================

Classification CoreDomain
Classification SupportingDomain
Classification GenericDomain

Classification HIPAACompliant
Classification MissionCritical
Classification PatientSafetyCritical

// ============================================================================
// Teams
// ============================================================================

Team ClinicalTeam
Team AdministrativeTeam
Team ITSecurityTeam
Team BillingTeam
Team PharmacyTeam

// ============================================================================
// Domain Hierarchy
// ============================================================================

Domain Healthcare {
    description: "Hospital and healthcare management"
    vision: "Deliver exceptional patient care through integrated systems"
    type: CoreDomain
}

Domain PatientCare in Healthcare {
    description: "Direct patient care and treatment"
    type: CoreDomain
}

Domain Administration in Healthcare {
    description: "Hospital administration and operations"
    type: SupportingDomain
}

Domain Pharmacy in Healthcare {
    description: "Medication management and dispensing"
    type: CoreDomain
}

// ============================================================================
// Clinical Bounded Contexts
// ============================================================================

bc ElectronicHealthRecords for PatientCare
    as CoreDomain
    by ClinicalTeam {

    description: "Patient medical records and health history"

    terminology {
        term Patient: "Individual receiving medical care"
            aka MedicalPatient, HealthcarePatient

        term MedicalRecord: "Complete health history of patient"
            aka EHR, EMR, PatientRecord
            examples "Patient #12345 Medical History"

        term Encounter: "Single visit or interaction with healthcare provider"
            aka Visit, Appointment, Consultation

        term Diagnosis: "Medical condition identification"
            aka MedicalDiagnosis, Condition
            examples "Type 2 Diabetes", "Hypertension", "Acute Bronchitis"

        term Treatment: "Medical intervention for condition"
            aka TherapeuticIntervention, MedicalTreatment

        term VitalSigns: "Basic health measurements"
            examples "Blood Pressure: 120/80", "Temperature: 98.6°F"

        term Allergy: "Adverse reaction to substance"
            examples "Penicillin", "Peanuts", "Latex"
    }

    decisions {
        decision [HIPAACompliant] HL7FHIR:
            "Use HL7 FHIR standard for healthcare data exchange"

        decision [PatientSafetyCritical] EndToEndEncryption:
            "Encrypt all PHI (Protected Health Information) end-to-end"

        policy RecordRetention:
            "Maintain medical records for minimum 7 years"
    }
}

bc AppointmentScheduling for Administration
    as SupportingDomain
    by AdministrativeTeam {

    description: "Patient appointment management"

    terminology {
        term Appointment: "Scheduled visit with healthcare provider"
        term Slot: "Available time period for appointments"
        term Provider: "Healthcare professional providing care"
    }

    relationships {
        [CF] this -> [OHS] ElectronicHealthRecords
    }
}

bc MedicationManagement for Pharmacy
    as CoreDomain
    by PharmacyTeam {

    description: "Prescription and medication dispensing"

    terminology {
        term Prescription: "Order for medication"
            examples "Lisinopril 10mg daily"

        term Medication: "Drug or pharmaceutical product"
        
        term DrugInteraction: "Adverse effect when medications combined"
    }

    decisions {
        decision [PatientSafetyCritical] DrugInteractionChecks:
            "Automatically check for drug interactions on every prescription"
    }

    relationships {
        [ACL] this <- ElectronicHealthRecords
    }
}

// ============================================================================
// Context Map
// ============================================================================

ContextMap HealthcareSystem {
    contains ElectronicHealthRecords, AppointmentScheduling, MedicationManagement

    [OHS] ElectronicHealthRecords -> [CF] AppointmentScheduling
    [OHS] ElectronicHealthRecords -> [ACL] MedicationManagement
}
```

## Key Patterns Demonstrated

### Healthcare-Specific Classifications

Classifications capture regulatory and safety requirements:

```dlang
Classification HIPAACompliant
Classification PatientSafetyCritical

decisions {
    decision [HIPAACompliant] HL7FHIR: "..."
    decision [PatientSafetyCritical] DrugInteractionChecks: "..."
}
```

### Medical Terminology

Rich terminology with domain-specific aliases:

```dlang
terminology {
    term MedicalRecord: "Complete health history of patient"
        aka EHR, EMR, PatientRecord
        examples "Patient #12345 Medical History"
}
```

### Clinical Integration Patterns

The EHR system provides an Open Host Service that other contexts consume:

```dlang
[OHS] ElectronicHealthRecords -> [CF] AppointmentScheduling
[OHS] ElectronicHealthRecords -> [ACL] MedicationManagement
```

- AppointmentScheduling conforms to the EHR API
- MedicationManagement uses an Anti-Corruption Layer to translate between clinical and pharmacy models

### Policy Documentation

Business rules and compliance policies are captured:

```dlang
decisions {
    policy RecordRetention:
        "Maintain medical records for minimum 7 years"
}
```

## Full Example

View the complete healthcare system example in the repository:

[healthcare-system.dlang on GitHub](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/examples/healthcare-system.dlang)
