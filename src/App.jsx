import React, { useState, useCallback, useId } from 'react'
import './App.css'

const PRESET_TIPS = [10, 15, 20]
const MAX_TIP = 100
const CURRENCY = 'Rs'

function formatCurrency(value) {
  return `${CURRENCY} ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function calcPerPerson(total, people) {
  const raw = total / people
  return Math.ceil(raw * 100) / 100
}

function useField(initial = '') {
  const [value, setValue] = useState(initial)
  const [touched, setTouched] = useState(false)
  return {
    value, setValue,
    touched, setTouched,
    onChange: (e) => { setValue(e.target.value); setTouched(true) },
    onBlur: () => setTouched(true),
  }
}

export default function App() {
  const billField = useField('')
  const [tipMode, setTipMode] = useState(15)
  const [customTip, setCustomTip] = useState('')
  const [customTipTouched, setCustomTipTouched] = useState(false)
  const peopleField = useField('1')

  const billId = useId()
  const peopleId = useId()
  const customId = useId()

  const billRaw = billField.value.trim()
  const billNum = parseFloat(billRaw)
  const billValid = billRaw !== '' && isFinite(billNum) && billNum > 0
  const billError = billField.touched && billRaw !== '' && !billValid
    ? billNum <= 0 ? 'Bill must be a positive number.' : 'Enter a valid number.'
    : null

  const activeTip = tipMode === 'custom' ? parseFloat(customTip) : tipMode
  const tipValid = isFinite(activeTip) && activeTip >= 0 && activeTip <= MAX_TIP
  const customTipError = tipMode === 'custom' && customTipTouched && customTip !== ''
    ? (!isFinite(parseFloat(customTip)) ? 'Enter a valid percentage.'
      : parseFloat(customTip) < 0 ? 'Tip cannot be negative.'
      : parseFloat(customTip) > MAX_TIP ? `Max tip is ${MAX_TIP}%.`
      : null)
    : null

  const peopleRaw = peopleField.value.trim()
  const peopleNum = parseInt(peopleRaw, 10)
  const peopleValid = peopleRaw !== '' && Number.isInteger(peopleNum) && peopleNum >= 1 && String(peopleNum) === peopleRaw
  const peopleError = peopleField.touched && peopleRaw !== '' && !peopleValid
    ? peopleNum < 1 ? 'Must be at least 1 person.' : 'Enter a whole number.'
    : null

  const canCompute = billValid && tipValid && peopleValid && (tipMode !== 'custom' || customTip !== '')

  const tipAmount = canCompute ? billNum * (activeTip / 100) : null
  const grandTotal = canCompute ? billNum + tipAmount : null
  const perPerson = canCompute ? calcPerPerson(grandTotal, peopleNum) : null

  const reset = useCallback(() => {
    billField.setValue(''); billField.setTouched(false)
    setTipMode(15); setCustomTip(''); setCustomTipTouched(false)
    peopleField.setValue('1'); peopleField.setTouched(false)
  }, [])

  const handleTipPreset = (pct) => {
    setTipMode(pct); setCustomTip(''); setCustomTipTouched(false)
  }

  const handleCustomChange = (e) => {
    setTipMode('custom'); setCustomTip(e.target.value); setCustomTipTouched(true)
  }

  const handlePeopleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      peopleField.setValue(String(Math.max(1, (peopleNum || 0) + 1)))
      peopleField.setTouched(true)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      peopleField.setValue(String(Math.max(1, (peopleNum || 2) - 1)))
      peopleField.setTouched(true)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <span className="header-eyebrow">Bill Calculator</span>
        <h1 className="header-title">Tip &amp; <em>Split</em></h1>
      </header>

      <main className="card">
        <div className="field-group">
          <label className="field-label" htmlFor={billId}>Bill Amount</label>
          <div className={`input-wrap ${billError ? 'has-error' : ''}`}>
            <span className="prefix">{CURRENCY}</span>
            <input id={billId} className="input" type="number" inputMode="decimal"
              min="0" step="0.01" placeholder="0.00"
              value={billField.value} onChange={billField.onChange} onBlur={billField.onBlur}
              aria-invalid={!!billError} />
          </div>
          {billError && <span className="field-error" role="alert">{billError}</span>}
        </div>

        <div className="field-group">
          <label className="field-label" id="tip-label">Tip Percentage</label>
          <div className="tip-row" role="group" aria-labelledby="tip-label">
            {PRESET_TIPS.map(pct => (
              <button key={pct} type="button"
                className={`tip-btn ${tipMode === pct ? 'active' : ''}`}
                onClick={() => handleTipPreset(pct)} aria-pressed={tipMode === pct}>
                {pct}%
              </button>
            ))}
            <div className={`custom-tip-wrap ${tipMode === 'custom' ? 'active' : ''}`}>
              <input id={customId} className="custom-tip-input" type="number"
                inputMode="decimal" min="0" max={MAX_TIP} placeholder="Custom"
                value={customTip} onFocus={() => setTipMode('custom')}
                onChange={handleCustomChange} aria-label="Custom tip percentage" />
              <span className="custom-tip-unit">%</span>
            </div>
          </div>
          {customTipError && <span className="field-error" role="alert">{customTipError}</span>}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor={peopleId}>Number of People</label>
          <div className={`input-wrap ${peopleError ? 'has-error' : ''}`}>
            <input id={peopleId} className="input" type="number" inputMode="numeric"
              min="1" step="1" placeholder="1"
              value={peopleField.value} onChange={peopleField.onChange}
              onBlur={peopleField.onBlur} onKeyDown={handlePeopleKeyDown}
              aria-invalid={!!peopleError} />
          </div>
          {peopleError && <span className="field-error" role="alert">{peopleError}</span>}
        </div>

        <div className="divider" aria-hidden="true"><span className="divider-dot" /></div>

        <section className="summary" aria-label="Bill summary" aria-live="polite">
          <div className="summary-header">Summary</div>
          {canCompute ? (
            <div className="summary-rows">
              <div className="summary-row">
                <span>Tip amount</span>
                <span className="summary-value">{formatCurrency(tipAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Bill subtotal</span>
                <span className="summary-value">{formatCurrency(billNum)}</span>
              </div>
              <div className="summary-row">
                <span>Grand total (bill + tip)</span>
                <span className="summary-value">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="summary-row summary-row--highlight">
                <span><em>Each person pays</em></span>
                <span className="summary-value summary-value--big">{formatCurrency(perPerson)}</span>
              </div>
            </div>
          ) : (
            <p className="summary-empty">Enter valid values to see results</p>
          )}
        </section>

        <button type="button" className="reset-btn" onClick={reset}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M7.5 2C4.46 2 2 4.46 2 7.5S4.46 13 7.5 13 13 10.54 13 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M13 3.5V7.5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Reset
        </button>
      </main>

      <footer className="footer">Rounds per-person share up to nearest paisa</footer>
    </div>
  )
}