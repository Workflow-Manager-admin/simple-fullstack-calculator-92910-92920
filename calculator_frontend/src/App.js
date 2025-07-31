import React, { useState, useEffect } from "react";
import "./App.css";

// API base URL from request details:
const API_BASE_URL = "http://localhost:3001/api";

const COLOR_PRIMARY = "#1976d2";
const COLOR_ACCENT = "#ff9800";
const COLOR_SECONDARY = "#424242";

/**
 * Utility function to format backend errors for user display
 */
function formatApiError(error) {
  if (error && error.message) return error.message;
  return "An unknown error occurred. Please try again.";
}

// Calculator operators, order and labels
const OPERATORS = [
  { op: "+", label: "+" },
  { op: "-", label: "−" },
  { op: "*", label: "×" },
  { op: "/", label: "÷" },
];

// PUBLIC_INTERFACE
function App() {
  // States for inputs:
  const [operand1, setOperand1] = useState("");
  const [operand2, setOperand2] = useState("");
  const [operator, setOperator] = useState("+");

  // States for calculation & error display
  const [result, setResult] = useState(null);
  const [operationText, setOperationText] = useState("");
  const [error, setError] = useState("");

  // Calculation history
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI: Centering logic (nothing to do, CSS flex handles)
  // Color palette is injected via useEffect
  useEffect(() => {
    // Set CSS variables for colors at root for consistent palette usage
    document.documentElement.style.setProperty("--primary", COLOR_PRIMARY);
    document.documentElement.style.setProperty("--accent", COLOR_ACCENT);
    document.documentElement.style.setProperty("--secondary", COLOR_SECONDARY);
  }, []);

  // Fetch calculation history from backend
  // PUBLIC_INTERFACE
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/history/`);
      if (!resp.ok) throw new Error("Failed to fetch history");
      const data = await resp.json();
      setHistory(data);
    } catch (err) {
      setError(formatApiError(err));
    }
    setLoadingHistory(false);
  };

  // Fetch history on mount & after calculation
  useEffect(() => {
    fetchHistory();
    // Don't include fetchHistory in deps to avoid infinite loop
    // eslint-disable-next-line
  }, []);

  // Handler for number input fields:
  const handleInputChange = (setter) => (e) => {
    // Only allow numeric values, decimal points, or '' (empty)
    const val = e.target.value;
    if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
      setter(val);
      setError("");
    }
  };

  // Handler for operator selection
  const handleOperator = (op) => () => {
    setOperator(op);
    setError("");
  };

  // PUBLIC_INTERFACE
  // Handle calculation (send API request)
  const handleCalculate = async () => {
    setError("");
    setResult(null);
    setOperationText("");
    // Validate input fields
    if (operand1 === "" || operand2 === "") {
      setError("Please enter valid numbers in both fields.");
      return;
    }
    // Compose request body
    let requestBody = {
      operand1: parseFloat(operand1),
      operand2: parseFloat(operand2),
      operator,
    };
    // Quick frontend check to avoid division by zero UX
    if (operator === "/" && Number(operand2) === 0) {
      setError("Division by zero is not allowed.");
      return;
    }
    try {
      const resp = await fetch(`${API_BASE_URL}/calculate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!resp.ok) {
        let errMsg = "Calculation failed.";
        if (resp.status === 400) {
          const errData = await resp.json();
          errMsg = errData.detail || "Invalid input for calculation.";
        }
        throw new Error(errMsg);
      }
      const data = await resp.json();
      setResult(data.result);
      setOperationText(data.operation || "");
      // Refresh history
      fetchHistory();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  // PUBLIC_INTERFACE
  // Clear all fields/results
  const handleClear = () => {
    setOperand1("");
    setOperand2("");
    setOperator("+");
    setResult(null);
    setOperationText("");
    setError("");
  };

  // UI Main rendering:
  return (
    <div className="App" style={{ minHeight: "100vh" }}>
      <div className="calculator-root">
        <h1 className="title">Calculator</h1>
        <form
          className="calculator-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCalculate();
          }}
          autoComplete="off"
        >
          <div className="inputs-row">
            <input
              type="text"
              inputMode="decimal"
              className="calc-input"
              placeholder="First number"
              value={operand1}
              onChange={handleInputChange(setOperand1)}
              aria-label="First operand"
            />
            <div className="op-group">
              {OPERATORS.map((item) => (
                <button
                  key={item.op}
                  type="button"
                  className={
                    "op-btn" + (operator === item.op ? " op-active" : "")
                  }
                  onClick={handleOperator(item.op)}
                  tabIndex={0}
                  style={
                    operator === item.op
                      ? {
                          background: `var(--primary)`,
                          color: "#fff",
                        }
                      : {}
                  }
                  aria-label={item.label}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="decimal"
              className="calc-input"
              placeholder="Second number"
              value={operand2}
              onChange={handleInputChange(setOperand2)}
              aria-label="Second operand"
            />
          </div>
          <div className="actions-row">
            <button
              type="submit"
              className="action-btn"
              style={{
                background: `var(--primary)`,
                color: "#fff",
              }}
              aria-label="Calculate"
            >
              Calculate
            </button>
            <button
              type="button"
              className="action-btn"
              style={{
                background: `var(--secondary)`,
                color: "#fff",
              }}
              onClick={handleClear}
              aria-label="Clear fields"
            >
              Clear
            </button>
          </div>
        </form>
        {/* Result / Operation text */}
        <div className="result-area">
          {error && <div className="calc-error">{error}</div>}
          {result !== null && !error && (
            <div className="calc-result">
              <span className="operation">{operationText}</span>
              <span className="equals">=</span>
              <span className="result-number">{result}</span>
            </div>
          )}
        </div>
        {/* History */}
        <div className="history-area">
          <h2 className="subtitle">History</h2>
          {loadingHistory ? (
            <div className="history-loading">Loading...</div>
          ) : history && history.length > 0 ? (
            <ul className="history-list">
              {history.slice(0, 10).map((rec) => (
                <li key={rec.id || `${rec.operand1}${rec.operator}${rec.operand2}${rec.created_at}`}>
                  <span className="history-operation">{rec.operand1}</span>
                  <span className="history-operation op">{rec.operator}</span>
                  <span className="history-operation">{rec.operand2}</span>
                  <span className="history-operation eq">=</span>
                  <span className="history-operation res">{rec.result}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="history-empty">No calculations performed yet.</div>
          )}
        </div>
        {/* Footer */}
        <div className="footer">
          <span>
            Powered by <b style={{ color: "var(--primary)" }}>React</b> &amp;{" "}
            <b style={{ color: "var(--accent)" }}>Django API</b>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
