import { useState, useEffect } from 'react'
import EntitySelect    from './EntitySelect.jsx'
import ApplicantCount  from './ApplicantCount.jsx'
import IcoVerify       from './IcoVerify.jsx'
import EmployeeDetails from './EmployeeDetails.jsx'
import BusinessIncome  from './BusinessIncome.jsx'
import SroIncome       from './SroIncome.jsx'

export default function Step1EntityType({
  value,
  onChange,
  onIcoResult,
  numberOfApplicants = 1,
  onApplicantCountChange,
  employeeData,
  onEmployeeChange,
  businessData,
  onBusinessChange,
  onContinue,
  onSubStepChange,
}) {
  const [subStep, setSubStep] = useState(0)

  const isEmployee = value === 'zamestnanec'
  const isOSVC     = value === 'osvc'
  const isSRODir   = value === 'sro'

  // Sub-step flow depends on entity type:
  // All paths:    0: EntitySelect -> 1: ApplicantCount
  // Employee:     -> 2: EmployeeDetails -> done
  // OSVC:         -> 2: IcoVerify -> 3: BusinessIncome -> done
  // s.r.o.:       -> 2: IcoVerify -> 3: SroIncome -> done

  // Notify parent of sub-step changes for progress calculation
  useEffect(() => {
    if (onSubStepChange) onSubStepChange(subStep)
  }, [subStep, onSubStepChange])

  const goForward = () => {
    setSubStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setSubStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Sub-step 0: Entity type selection
  if (subStep === 0) {
    return (
      <EntitySelect
        value={value}
        onChange={(v) => {
          onChange(v)
        }}
        onContinue={goForward}
      />
    )
  }

  // Sub-step 1: Applicant count
  if (subStep === 1) {
    return (
      <ApplicantCount
        value={numberOfApplicants}
        onChange={onApplicantCountChange}
        onBack={goBack}
        onContinue={goForward}
      />
    )
  }

  // Sub-step 2: IČO verification (OSVC / s.r.o.) OR Employee details
  if (subStep === 2) {
    if (isEmployee) {
      return (
        <EmployeeDetails
          data={employeeData ?? {}}
          onChange={onEmployeeChange}
          onBack={goBack}
          onContinue={onContinue}
        />
      )
    }

    // OSVC or s.r.o. -> IČO verification
    return (
      <IcoVerify
        entityType={value}
        businessData={businessData}
        onResult={(result) => {
          onIcoResult(result)
          if (result.entityType) onChange(result.entityType)
        }}
        onBack={goBack}
        onContinue={goForward}
      />
    )
  }

  // Sub-step 3: Income details (OSVC or s.r.o.)
  if (subStep === 3) {
    if (isOSVC) {
      return (
        <BusinessIncome
          data={businessData ?? {}}
          onChange={onBusinessChange}
          onBack={goBack}
          onContinue={onContinue}
        />
      )
    }

    // s.r.o.
    return (
      <SroIncome
        data={businessData ?? {}}
        onChange={onBusinessChange}
        onBack={goBack}
        onContinue={onContinue}
      />
    )
  }

  // Fallback
  return null
}
