// Differential Equations course — ODEs and basic techniques.
const DIFFEQ_COURSE = {
  id: "diffeq",
  title: "Differential Equations",
  subtitle: "ODEs: separable, linear, systems, Laplace",
  emoji: "📈",
  accent: "#48dbfb",
  accent2: "#0abde3",
  description: "Five chapters covering first- and higher-order ODEs, systems, Laplace transforms, and numerical methods.",
  books: [
    {
      id: "de1", num: 1, title: "First-Order ODEs", subtitle: "Separable, linear, exact",
      emoji: "1️⃣", accent: "#48dbfb", accent2: "#0abde3",
      sections: [
        {
          title: "Separable Equations",
          questions: [
            { type: "regular", q: "Solve \\(dy/dx = y\\).", answer: "\\(y = Ce^x\\).", solution: "Separate, integrate." },
            { type: "regular", q: "Solve \\(dy/dx = 2x\\).", answer: "\\(y = x^2 + C\\).", solution: "Direct integration." },
            { type: "regular", q: "Separable form?", answer: "\\(dy/dx = f(x)g(y)\\).", solution: "Variables separate." },
            { type: "regular", q: "Solve \\(dy/dx = y/x\\).", answer: "\\(y = Cx\\).", solution: "\\(dy/y = dx/x\\)." },
            { type: "word", q: "Population grows at rate proportional to itself: ODE?", answer: "\\(dP/dt = kP\\).", solution: "Standard model." }
          ]
        },
        {
          title: "Linear First-Order",
          questions: [
            { type: "regular", q: "Standard linear ODE form?", answer: "\\(y' + P(x)y = Q(x)\\).", solution: "Standard." },
            { type: "regular", q: "Integrating factor?", answer: "\\(e^{\\int P(x) dx}\\).", solution: "Standard." },
            { type: "regular", q: "Solve \\(y' + 2y = 0\\).", answer: "\\(y = Ce^{-2x}\\).", solution: "Separable too." },
            { type: "regular", q: "Solve \\(y' + y = e^x\\).", answer: "\\(y = \\tfrac{1}{2}e^x + Ce^{-x}\\).", solution: "Integrating factor \\(e^x\\)." },
            { type: "word", q: "Newton's cooling: \\(dT/dt = -k(T - T_{room})\\). Linear?", answer: "Yes.", solution: "Linear first-order." }
          ]
        },
        {
          title: "Exact Equations",
          questions: [
            { type: "regular", q: "Exact equation condition?", answer: "\\(\\partial M/\\partial y = \\partial N/\\partial x\\).", solution: "Standard." },
            { type: "regular", q: "Form of exact equation?", answer: "\\(M\\,dx + N\\,dy = 0\\) with above condition.", solution: "Standard." },
            { type: "regular", q: "Solve \\(2x\\,dx + 2y\\,dy = 0\\).", answer: "\\(x^2 + y^2 = C\\).", solution: "Integrate." },
            { type: "regular", q: "Implicit solution F(x,y) = C, where dF = ?", answer: "\\(M\\,dx + N\\,dy\\).", solution: "Standard." },
            { type: "word", q: "If not exact, can sometimes find?", answer: "Integrating factor.", solution: "To make exact." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — First-Order ODEs",
        questions: [
          { type: "regular", q: "Solve \\(dy/dx = -y\\).", answer: "\\(y = Ce^{-x}\\).", solution: "Separable." },
          { type: "regular", q: "Linear standard form?", answer: "\\(y' + Py = Q\\).", solution: "Standard." },
          { type: "regular", q: "Integrating factor for \\(y' + y = 0\\)?", answer: "\\(e^x\\).", solution: "\\(\\int 1 dx\\)." },
          { type: "regular", q: "Exact condition?", answer: "\\(M_y = N_x\\).", solution: "Standard." },
          { type: "word", q: "Solve \\(dy/dx = 3x^2\\).", answer: "\\(y = x^3 + C\\).", solution: "Integrate." },
          { type: "word", q: "Population model?", answer: "\\(dP/dt = kP\\).", solution: "Exponential growth." }
        ]
      }
    },
    {
      id: "de2", num: 2, title: "Higher-Order Linear ODEs", subtitle: "Homogeneous and nonhomogeneous",
      emoji: "2️⃣", accent: "#54a0ff", accent2: "#48dbfb",
      sections: [
        {
          title: "Homogeneous Linear",
          questions: [
            { type: "regular", q: "\\(y'' - y = 0\\) char eq?", answer: "\\(r^2 - 1 = 0\\).", solution: "Substitute \\(y = e^{rx}\\)." },
            { type: "regular", q: "Solve \\(y'' - y = 0\\).", answer: "\\(y = C_1 e^x + C_2 e^{-x}\\).", solution: "Roots ±1." },
            { type: "regular", q: "\\(y'' + y = 0\\) general solution?", answer: "\\(y = C_1\\cos x + C_2\\sin x\\).", solution: "Complex roots ±i." },
            { type: "regular", q: "Repeated root r: solution?", answer: "\\((C_1 + C_2 x)e^{rx}\\).", solution: "Standard." },
            { type: "word", q: "Damped harmonic: \\(my'' + cy' + ky = 0\\). Linear?", answer: "Yes.", solution: "Standard 2nd-order." }
          ]
        },
        {
          title: "Method of Undetermined Coefficients",
          questions: [
            { type: "regular", q: "Trial for \\(y'' + y = e^x\\)?", answer: "\\(y_p = Ae^x\\).", solution: "Same form as RHS." },
            { type: "regular", q: "Trial for \\(y'' + y = x\\)?", answer: "\\(y_p = Ax + B\\).", solution: "Polynomial of same degree." },
            { type: "regular", q: "Trial for \\(y'' + y = \\cos x\\)? (resonance case)", answer: "\\(y_p = x(A\\cos x + B\\sin x)\\).", solution: "Multiply by x." },
            { type: "regular", q: "General solution = ?", answer: "\\(y_h + y_p\\).", solution: "Homogeneous + particular." },
            { type: "word", q: "Why multiply trial by x in resonance?", answer: "Avoid duplicating homogeneous solution.", solution: "Standard rule." }
          ]
        },
        {
          title: "Variation of Parameters",
          questions: [
            { type: "regular", q: "Variation of parameters works when method of undetermined coefficients?", answer: "Doesn't apply (e.g., RHS not nice).", solution: "More general." },
            { type: "regular", q: "Wronskian formula for 2 functions?", answer: "\\(W = y_1 y_2' - y_2 y_1'\\).", solution: "Standard." },
            { type: "regular", q: "If W ≠ 0, solutions are?", answer: "Linearly independent.", solution: "Standard." },
            { type: "regular", q: "Method's main outputs?", answer: "Two functions \\(u_1, u_2\\) to multiply solutions.", solution: "Standard." },
            { type: "word", q: "Most general method for 2nd-order linear nonhomogeneous?", answer: "Variation of parameters.", solution: "Always works." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Higher-Order Linear",
        questions: [
          { type: "regular", q: "\\(y'' - 4y = 0\\) general?", answer: "\\(C_1 e^{2x} + C_2 e^{-2x}\\).", solution: "Roots ±2." },
          { type: "regular", q: "\\(y'' + 4y = 0\\) general?", answer: "\\(C_1\\cos 2x + C_2\\sin 2x\\).", solution: "Imaginary ±2i." },
          { type: "regular", q: "General sol form?", answer: "\\(y_h + y_p\\).", solution: "Standard." },
          { type: "regular", q: "Wronskian for indep?", answer: "Nonzero.", solution: "Standard." },
          { type: "word", q: "Repeated root r: 2nd indep sol?", answer: "\\(xe^{rx}\\).", solution: "Standard." },
          { type: "word", q: "Trial for \\(y'' + y = e^{2x}\\)?", answer: "\\(Ae^{2x}\\).", solution: "No resonance." }
        ]
      }
    },
    {
      id: "de3", num: 3, title: "Systems of ODEs", subtitle: "Linear systems and eigenvalues",
      emoji: "🔗", accent: "#10ac84", accent2: "#1dd1a1",
      sections: [
        {
          title: "Linear Systems Setup",
          questions: [
            { type: "regular", q: "System form?", answer: "\\(x' = Ax\\).", solution: "Standard." },
            { type: "regular", q: "Solution via eigenvalues: \\(x = ?\\)", answer: "\\(c_1 v_1 e^{\\lambda_1 t} + c_2 v_2 e^{\\lambda_2 t}\\).", solution: "Eigen-decomposition." },
            { type: "regular", q: "If \\(\\lambda\\) complex \\(a \\pm bi\\), solution involves?", answer: "\\(e^{at}\\) and trig functions.", solution: "Standard." },
            { type: "regular", q: "Stable equilibrium when eigenvalues are?", answer: "Both negative (real parts).", solution: "Decay." },
            { type: "word", q: "Predator-prey is a system. T/F?", answer: "True.", solution: "Coupled ODEs." }
          ]
        },
        {
          title: "Phase Plane Basics",
          questions: [
            { type: "regular", q: "Phase plane plots?", answer: "Variables against each other (not vs time).", solution: "Standard." },
            { type: "regular", q: "Origin classification with two negative real eigenvalues?", answer: "Stable node.", solution: "Standard." },
            { type: "regular", q: "Origin with two positive real eigenvalues?", answer: "Unstable node.", solution: "Standard." },
            { type: "regular", q: "Real eigenvalues opposite signs?", answer: "Saddle point.", solution: "Standard." },
            { type: "word", q: "Complex eigenvalues with zero real part?", answer: "Center (closed orbits).", solution: "Standard." }
          ]
        },
        {
          title: "Decoupling & Diagonalization",
          questions: [
            { type: "regular", q: "Diagonalization simplifies systems by?", answer: "Decoupling variables.", solution: "Standard." },
            { type: "regular", q: "If \\(A = PDP^{-1}\\), substitute \\(x = Py\\): gives?", answer: "\\(y' = Dy\\) (decoupled).", solution: "Standard." },
            { type: "regular", q: "Number of independent eigenvectors needed for diagonalization?", answer: "n.", solution: "Full set." },
            { type: "regular", q: "Repeated eigenvalues might prevent?", answer: "Diagonalization.", solution: "Defective." },
            { type: "word", q: "What if not diagonalizable?", answer: "Use Jordan form.", solution: "Advanced." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Systems",
        questions: [
          { type: "regular", q: "System form?", answer: "\\(x' = Ax\\).", solution: "Standard." },
          { type: "regular", q: "Phase plane axes?", answer: "Variables (not time).", solution: "Standard." },
          { type: "regular", q: "Two negative real eigenvalues at origin?", answer: "Stable node.", solution: "Standard." },
          { type: "regular", q: "Diagonalization decouples?", answer: "Variables.", solution: "Standard." },
          { type: "word", q: "Opposite-sign real eigenvalues?", answer: "Saddle.", solution: "Standard." },
          { type: "word", q: "Pure imaginary eigenvalues?", answer: "Center (closed orbits).", solution: "Standard." }
        ]
      }
    },
    {
      id: "de4", num: 4, title: "Laplace Transforms", subtitle: "From t-domain to s-domain",
      emoji: "ℒ", accent: "#5f27cd", accent2: "#48dbfb",
      sections: [
        {
          title: "Basic Transforms",
          questions: [
            { type: "regular", q: "\\(\\mathcal{L}\\{1\\}\\)?", answer: "\\(1/s\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\mathcal{L}\\{e^{at}\\}\\)?", answer: "\\(1/(s-a)\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\mathcal{L}\\{t\\}\\)?", answer: "\\(1/s^2\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\mathcal{L}\\{\\sin\\omega t\\}\\)?", answer: "\\(\\omega/(s^2 + \\omega^2)\\).", solution: "Standard." },
            { type: "word", q: "Laplace is linear: \\(\\mathcal{L}\\{af + bg\\}\\) = ?", answer: "\\(a\\mathcal{L}\\{f\\} + b\\mathcal{L}\\{g\\}\\).", solution: "Linearity." }
          ]
        },
        {
          title: "Inverse Transforms & Partial Fractions",
          questions: [
            { type: "regular", q: "Inverse Laplace of \\(1/(s-2)\\)?", answer: "\\(e^{2t}\\).", solution: "Standard table." },
            { type: "regular", q: "Inverse of \\(1/s^2\\)?", answer: "t.", solution: "Standard." },
            { type: "regular", q: "Inverse of \\(s/(s^2 + 4)\\)?", answer: "\\(\\cos 2t\\).", solution: "Standard." },
            { type: "regular", q: "Partial fractions used for?", answer: "Decomposing rational F(s) before inverting.", solution: "Standard." },
            { type: "word", q: "Inverse of \\(1/(s^2 + 1)\\)?", answer: "\\(\\sin t\\).", solution: "Standard." }
          ]
        },
        {
          title: "Solving IVPs",
          questions: [
            { type: "regular", q: "\\(\\mathcal{L}\\{y'\\}\\) = ?", answer: "\\(sY - y(0)\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\mathcal{L}\\{y''\\}\\)?", answer: "\\(s^2 Y - sy(0) - y'(0)\\).", solution: "Standard." },
            { type: "regular", q: "Laplace method for IVP: do what?", answer: "Transform → solve for Y(s) → invert.", solution: "Standard." },
            { type: "regular", q: "Why include initial conditions in derivative transform?", answer: "They appear naturally.", solution: "Standard." },
            { type: "word", q: "Use Laplace when ODE has discontinuous forcing?", answer: "Yes, very convenient.", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Laplace Transforms",
        questions: [
          { type: "regular", q: "\\(\\mathcal{L}\\{1\\}\\)?", answer: "\\(1/s\\).", solution: "Standard." },
          { type: "regular", q: "\\(\\mathcal{L}\\{t\\}\\)?", answer: "\\(1/s^2\\).", solution: "Standard." },
          { type: "regular", q: "Inverse of \\(1/(s+3)\\)?", answer: "\\(e^{-3t}\\).", solution: "Standard." },
          { type: "regular", q: "\\(\\mathcal{L}\\{y'\\}\\)?", answer: "\\(sY - y(0)\\).", solution: "Standard." },
          { type: "word", q: "Inverse of \\(2/(s^2+4)\\)?", answer: "\\(\\sin 2t\\).", solution: "Standard." },
          { type: "word", q: "Linearity: \\(\\mathcal{L}\\{2f+3g\\}\\)?", answer: "\\(2\\mathcal{L}f + 3\\mathcal{L}g\\).", solution: "Standard." }
        ]
      }
    },
    {
      id: "de5", num: 5, title: "Numerical & Qualitative Methods", subtitle: "Euler, slope fields, stability",
      emoji: "💻", accent: "#feca57", accent2: "#ff9f43",
      sections: [
        {
          title: "Slope Fields",
          questions: [
            { type: "regular", q: "Slope field shows?", answer: "Direction of solution at each point.", solution: "Standard." },
            { type: "regular", q: "For \\(y' = y\\), slope at (0,1)?", answer: "1.", solution: "Plug in." },
            { type: "regular", q: "For \\(y' = x\\), slope at (2, anything)?", answer: "2.", solution: "Depends on x only." },
            { type: "regular", q: "Slope field for \\(y' = 0\\)?", answer: "All horizontal arrows.", solution: "Standard." },
            { type: "word", q: "Equilibrium solutions occur where?", answer: "\\(y' = 0\\) (constant slope).", solution: "Standard." }
          ]
        },
        {
          title: "Euler's Method",
          questions: [
            { type: "regular", q: "Euler formula?", answer: "\\(y_{n+1} = y_n + h f(x_n, y_n)\\).", solution: "Standard." },
            { type: "regular", q: "Smaller step h gives?", answer: "More accurate (slower).", solution: "Trade-off." },
            { type: "regular", q: "Euler error per step is order?", answer: "\\(O(h^2)\\).", solution: "Local truncation." },
            { type: "regular", q: "Total Euler error is order?", answer: "\\(O(h)\\).", solution: "Global error." },
            { type: "word", q: "Apply Euler to \\(y' = y, y(0)=1, h=0.1\\): \\(y(0.1)\\)?", answer: "1.1.", solution: "\\(1 + 0.1 \\cdot 1\\)." }
          ]
        },
        {
          title: "Equilibria & Stability",
          questions: [
            { type: "regular", q: "Equilibrium of \\(y' = y(y-2)\\)?", answer: "\\(y = 0\\) and \\(y = 2\\).", solution: "Set y' = 0." },
            { type: "regular", q: "Stable equilibrium nearby behavior?", answer: "Solutions approach it.", solution: "Standard." },
            { type: "regular", q: "Unstable equilibrium?", answer: "Solutions move away.", solution: "Standard." },
            { type: "regular", q: "Test sign of \\(f(y)\\) just above and below equilibrium to classify. T/F?", answer: "True.", solution: "Standard." },
            { type: "word", q: "Logistic: \\(y' = ry(1 - y/K)\\). Equilibria?", answer: "\\(y = 0\\) (unstable) and \\(y = K\\) (stable).", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Numerical & Qualitative",
        questions: [
          { type: "regular", q: "Euler formula?", answer: "\\(y_{n+1} = y_n + h f\\).", solution: "Standard." },
          { type: "regular", q: "Equilibrium of \\(y' = y - 5\\)?", answer: "\\(y = 5\\).", solution: "Set y' = 0." },
          { type: "regular", q: "Smaller step → ?", answer: "More accurate, slower.", solution: "Trade-off." },
          { type: "regular", q: "Slope at (1, 2) for \\(y' = xy\\)?", answer: "2.", solution: "\\(1 \\cdot 2\\)." },
          { type: "word", q: "Stable equilibrium behavior?", answer: "Nearby solutions converge.", solution: "Standard." },
          { type: "word", q: "Logistic stable equilibrium?", answer: "y = K.", solution: "Standard." }
        ]
      }
    }
  ]
};
