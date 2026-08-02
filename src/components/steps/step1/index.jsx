import { useState, useEffect, useRef } from 'react'
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
  const announcerRef = useRef(null)

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

  const announce = (msg) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = msg
    }
  }

  const goForward = () => {
    setSubStep((s) => s + 1)
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })
    announce('Next question')
  }

  const goBack = () => {
    setSubStep((s) => Math.max(0, s - 1))
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })
    announce('Previous question')
  }

  let content = null

  if (subStep === 0) {
    content = (
      <EntitySelect
        value={value}
        onChange={(v) => { onChange(v) }}
        onContinue={goForward}
      />
    )
  } else if (subStep === 1) {
    content = (
      <ApplicantCount
        value={numberOfApplicants}
        onChange={onApplicantCountChange}
        onBack={goBack}
        onContinue={goForward}
      />
    )
  } else if (subStep === 2) {
    if (isEmployee) {
      content = (
        <EmployeeDetails
          data={employeeData ?? {}}
          onChange={onEmployeeChange}
          onBack={goBack}
          onContinue={onContinue}
        />
      )
    } else {
      content = (
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
  } else if (subStep === 3) {
    if (isOSVC) {
      content = (
        <BusinessIncome
          data={businessData ?? {}}
          onChange={onBusinessChange}
          onBack={goBack}
          onContinue={onContinue}
        />
      )
    } else {
      content = (
        <SroIncome
          data={businessData ?? {}}
          onChange={onBusinessChange}
          onBack={goBack}
          onContinue={onContinue}
        />
      )
    }
  }

  return (
    <>
      <span ref={announcerRef} className="sr-only" aria-live="assertive" aria-atomic="true" />
      {content}
    </>
  )
}
