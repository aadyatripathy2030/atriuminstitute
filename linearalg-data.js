// Linear Algebra course — vectors, matrices, spaces, transformations.
const LINEARALG_COURSE = {
  id: "linearalg",
  title: "Linear Algebra",
  subtitle: "Vectors, matrices, spaces, eigenvalues",
  emoji: "🧊",
  accent: "#3a5d8c",
  accent2: "#7c94c2",
  description: "Five chapters from vector basics through eigenvalues and orthogonality.",
  books: [
    {
      id: "la1", num: 1, title: "Vectors", subtitle: "Operations and geometry",
      emoji: "➡️", accent: "#3a5d8c", accent2: "#7c94c2",
      sections: [
        {
          title: "Vector Basics",
          questions: [
            { type: "regular", q: "\\((1,2) + (3,4)\\)?", answer: "\\((4,6)\\).", solution: "Add componentwise." },
            { type: "regular", q: "\\(3 \\cdot (2,-1)\\)?", answer: "\\((6,-3)\\).", solution: "Multiply each component." },
            { type: "regular", q: "Magnitude of \\((3,4)\\)?", answer: "5.", solution: "\\(\\sqrt{9+16}\\)." },
            { type: "regular", q: "Unit vector in direction of \\((3,4)\\)?", answer: "\\((3/5, 4/5)\\).", solution: "Divide by magnitude." },
            { type: "word", q: "Vector from \\((1,2)\\) to \\((4,6)\\)?", answer: "\\((3,4)\\).", solution: "Subtract." }
          ]
        },
        {
          title: "Dot Product",
          questions: [
            { type: "regular", q: "\\((1,2) \\cdot (3,4)\\)?", answer: "11.", solution: "\\(1(3) + 2(4)\\)." },
            { type: "regular", q: "Dot product = 0 means?", answer: "Perpendicular (orthogonal).", solution: "Standard." },
            { type: "regular", q: "\\((1,0) \\cdot (0,1)\\)?", answer: "0.", solution: "Perpendicular." },
            { type: "regular", q: "\\(v \\cdot v\\) equals?", answer: "\\(\\|v\\|^2\\).", solution: "Magnitude squared." },
            { type: "word", q: "Angle between (1,0) and (0,1)?", answer: "\\(90°\\).", solution: "Dot = 0." }
          ]
        },
        {
          title: "Cross Product & Projections",
          questions: [
            { type: "regular", q: "\\((1,0,0) \\times (0,1,0)\\)?", answer: "\\((0,0,1)\\).", solution: "Right-hand rule." },
            { type: "regular", q: "Cross product result perpendicular to both. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Magnitude of cross product geometrically?", answer: "Area of parallelogram.", solution: "Standard." },
            { type: "regular", q: "Projection of u onto v formula?", answer: "\\(\\dfrac{u\\cdot v}{v\\cdot v}v\\).", solution: "Standard." },
            { type: "word", q: "Cross product only defined in?", answer: "3D.", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Vectors",
        questions: [
          { type: "regular", q: "\\((2,3) + (1,-1)\\)?", answer: "\\((3,2)\\).", solution: "Add." },
          { type: "regular", q: "Magnitude of \\((6,8)\\)?", answer: "10.", solution: "\\(\\sqrt{36+64}\\)." },
          { type: "regular", q: "\\((1,1) \\cdot (2,3)\\)?", answer: "5.", solution: "Dot." },
          { type: "regular", q: "If \\(u \\cdot v = 0\\), what's true?", answer: "Perpendicular.", solution: "Orthogonal." },
          { type: "word", q: "Unit vector of \\((0,5)\\)?", answer: "\\((0,1)\\).", solution: "Divide by 5." },
          { type: "word", q: "Cross product of i and j?", answer: "k.", solution: "Right hand." }
        ]
      }
    },
    {
      id: "la2", num: 2, title: "Matrices", subtitle: "Operations, inverses, determinants",
      emoji: "🔢", accent: "#222f3e", accent2: "#5d7a9c",
      sections: [
        {
          title: "Matrix Operations",
          questions: [
            { type: "regular", q: "When can A multiply B (sizes)?", answer: "A's cols = B's rows.", solution: "Inner dims." },
            { type: "regular", q: "\\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix} \\cdot \\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\\).", solution: "Times identity." },
            { type: "regular", q: "Transpose of \\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}1&3\\\\2&4\\end{pmatrix}\\).", solution: "Flip rows/cols." },
            { type: "regular", q: "Matrix mult commutative?", answer: "No.", solution: "AB ≠ BA in general." },
            { type: "word", q: "Result size of (3×2) · (2×4)?", answer: "3×4.", solution: "Outer dims." }
          ]
        },
        {
          title: "Determinants",
          questions: [
            { type: "regular", q: "Det \\(\\begin{pmatrix}2&3\\\\1&4\\end{pmatrix}\\)?", answer: "5.", solution: "8 − 3." },
            { type: "regular", q: "Det \\(I_n\\)?", answer: "1.", solution: "Diagonal product." },
            { type: "regular", q: "Det of triangular matrix?", answer: "Product of diagonal.", solution: "Standard." },
            { type: "regular", q: "Det = 0 means?", answer: "Singular (no inverse).", solution: "Standard." },
            { type: "word", q: "Det \\(\\begin{pmatrix}1&2\\\\2&4\\end{pmatrix}\\)?", answer: "0.", solution: "Rows linearly dependent." }
          ]
        },
        {
          title: "Inverses",
          questions: [
            { type: "regular", q: "Inverse of \\(\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}1/2&0\\\\0&1/3\\end{pmatrix}\\).", solution: "Reciprocal of diagonal." },
            { type: "regular", q: "If det A = 0, A has inverse?", answer: "No.", solution: "Singular." },
            { type: "regular", q: "\\((A^{-1})^{-1}\\)?", answer: "A.", solution: "Inverse of inverse." },
            { type: "regular", q: "\\((AB)^{-1}\\)?", answer: "\\(B^{-1}A^{-1}\\).", solution: "Reverse order." },
            { type: "word", q: "Solve AX = B via inverse?", answer: "X = A⁻¹B.", solution: "Multiply both sides." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Matrices",
        questions: [
          { type: "regular", q: "Det \\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\\)?", answer: "−2.", solution: "ad − bc." },
          { type: "regular", q: "Det of identity?", answer: "1.", solution: "Standard." },
          { type: "regular", q: "Mult AB commutative?", answer: "No.", solution: "General." },
          { type: "regular", q: "Det 0 implies?", answer: "No inverse.", solution: "Standard." },
          { type: "word", q: "Transpose of \\(\\begin{pmatrix}1&0\\\\2&3\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}1&2\\\\0&3\\end{pmatrix}\\).", solution: "Flip." },
          { type: "word", q: "\\((AB)^{-1}\\) = ?", answer: "\\(B^{-1}A^{-1}\\).", solution: "Reverse order." }
        ]
      }
    },
    {
      id: "la3", num: 3, title: "Linear Systems & Gauss-Jordan", subtitle: "Solving Ax = b",
      emoji: "📐", accent: "#10ac84", accent2: "#1dd1a1",
      sections: [
        {
          title: "Augmented Matrices",
          questions: [
            { type: "regular", q: "Augmented matrix for \\(2x+y=5, x-y=1\\)?", answer: "\\(\\left[\\begin{matrix}2&1&|&5\\\\1&-1&|&1\\end{matrix}\\right]\\).", solution: "Standard." },
            { type: "regular", q: "Solve \\(x+y=4, x-y=2\\).", answer: "x=3, y=1.", solution: "Add equations." },
            { type: "regular", q: "Number of variables = number of cols in coeff matrix. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Equation \\(0 = 5\\) in row reduction means?", answer: "No solution.", solution: "Inconsistent." },
            { type: "word", q: "If row reduces to \\(0 = 0\\), means?", answer: "Infinite solutions or extra info.", solution: "Dependent." }
          ]
        },
        {
          title: "Gauss-Jordan Elimination",
          questions: [
            { type: "regular", q: "RREF requires?", answer: "Leading 1s, zeros above and below pivots.", solution: "Reduced row echelon." },
            { type: "regular", q: "Pivot position is?", answer: "First nonzero in row.", solution: "Standard." },
            { type: "regular", q: "Free variable means?", answer: "Not a pivot column.", solution: "Standard." },
            { type: "regular", q: "Allowed row operations? (list 3)", answer: "Swap; scale; add multiple of one row to another.", solution: "Three elementary." },
            { type: "word", q: "If 3 unknowns and 2 pivots, free vars?", answer: "1.", solution: "Standard." }
          ]
        },
        {
          title: "Consistency & Solutions",
          questions: [
            { type: "regular", q: "System has unique solution when?", answer: "Pivots in every variable column, no \\(0 = c\\) with c ≠ 0.", solution: "Standard." },
            { type: "regular", q: "Homogeneous Ax = 0 always has?", answer: "Trivial solution x = 0.", solution: "Always consistent." },
            { type: "regular", q: "Rank > number of variables: possible?", answer: "No.", solution: "Rank ≤ min(rows, cols)." },
            { type: "regular", q: "Rank-nullity for n unknowns?", answer: "rank + nullity = n.", solution: "Standard theorem." },
            { type: "word", q: "If rank(A) < rank([A|b]), system is?", answer: "Inconsistent.", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Linear Systems",
        questions: [
          { type: "regular", q: "Solve x+y=5, x−y=1.", answer: "x=3, y=2.", solution: "Add equations." },
          { type: "regular", q: "RREF means?", answer: "Reduced row echelon form.", solution: "Standard." },
          { type: "regular", q: "Free variable count if 3 vars and 2 pivots?", answer: "1.", solution: "3-2." },
          { type: "regular", q: "Equation 0 = 4 in reduction means?", answer: "No solution.", solution: "Inconsistent." },
          { type: "word", q: "Ax = 0 always has?", answer: "Trivial solution.", solution: "Standard." },
          { type: "word", q: "Rank + nullity = ?", answer: "n (number of cols).", solution: "Rank-nullity." }
        ]
      }
    },
    {
      id: "la4", num: 4, title: "Vector Spaces", subtitle: "Basis, dimension, span",
      emoji: "🌌", accent: "#5f27cd", accent2: "#9b59b6",
      sections: [
        {
          title: "Span & Linear Independence",
          questions: [
            { type: "regular", q: "Does \\(\\{(1,0), (0,1)\\}\\) span \\(\\mathbb{R}^2\\)?", answer: "Yes.", solution: "Standard basis." },
            { type: "regular", q: "Are \\((1,2)\\) and \\((2,4)\\) linearly independent?", answer: "No.", solution: "Second = 2× first." },
            { type: "regular", q: "Trivial linear combination of n vectors?", answer: "All coefficients zero.", solution: "Standard." },
            { type: "regular", q: "Linearly independent means?", answer: "Only trivial combo gives zero.", solution: "Definition." },
            { type: "word", q: "Span of single vector v ≠ 0?", answer: "Line through origin.", solution: "1D subspace." }
          ]
        },
        {
          title: "Basis & Dimension",
          questions: [
            { type: "regular", q: "Basis of \\(\\mathbb{R}^3\\) standard?", answer: "\\(\\{(1,0,0),(0,1,0),(0,0,1)\\}\\).", solution: "Standard basis." },
            { type: "regular", q: "Dimension of \\(\\mathbb{R}^n\\)?", answer: "n.", solution: "Standard." },
            { type: "regular", q: "Basis = ?", answer: "Linearly independent set that spans.", solution: "Definition." },
            { type: "regular", q: "How many vectors in basis of 2D plane?", answer: "2.", solution: "Standard." },
            { type: "word", q: "Dimension of x-axis as subspace of \\(\\mathbb{R}^2\\)?", answer: "1.", solution: "One basis vector." }
          ]
        },
        {
          title: "Subspaces",
          questions: [
            { type: "regular", q: "Subspace must contain?", answer: "The zero vector.", solution: "Standard." },
            { type: "regular", q: "Is \\(\\{(x,y) : x + y = 0\\}\\) a subspace of \\(\\mathbb{R}^2\\)?", answer: "Yes.", solution: "Line through origin." },
            { type: "regular", q: "Is \\(\\{(x,y) : x + y = 1\\}\\) a subspace?", answer: "No.", solution: "Doesn't contain origin." },
            { type: "regular", q: "Null space of A is?", answer: "All x with Ax = 0.", solution: "Standard." },
            { type: "word", q: "Column space of A is span of?", answer: "Columns of A.", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Vector Spaces",
        questions: [
          { type: "regular", q: "Basis of \\(\\mathbb{R}^2\\) standard?", answer: "\\(\\{(1,0),(0,1)\\}\\).", solution: "Standard." },
          { type: "regular", q: "Dim of \\(\\mathbb{R}^4\\)?", answer: "4.", solution: "Standard." },
          { type: "regular", q: "Are \\((1,1)\\) and \\((2,2)\\) independent?", answer: "No.", solution: "Parallel." },
          { type: "regular", q: "Subspace must contain?", answer: "Zero vector.", solution: "Standard." },
          { type: "word", q: "Span of \\((1,0)\\) and \\((0,1)\\)?", answer: "All of \\(\\mathbb{R}^2\\).", solution: "Standard basis." },
          { type: "word", q: "Null space of A is solutions to?", answer: "Ax = 0.", solution: "Definition." }
        ]
      }
    },
    {
      id: "la5", num: 5, title: "Eigenvalues & Eigenvectors", subtitle: "Diagonalization basics",
      emoji: "🎯", accent: "#ee5253", accent2: "#ff9f43",
      sections: [
        {
          title: "Eigenvalues",
          questions: [
            { type: "regular", q: "Eigenvalue equation?", answer: "\\(Av = \\lambda v\\).", solution: "Standard." },
            { type: "regular", q: "Characteristic equation?", answer: "\\(\\det(A - \\lambda I) = 0\\).", solution: "Standard." },
            { type: "regular", q: "Eigenvalues of \\(\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}\\)?", answer: "2 and 3.", solution: "Diagonal." },
            { type: "regular", q: "Eigenvalues of identity?", answer: "All 1.", solution: "\\(Iv = 1 \\cdot v\\)." },
            { type: "word", q: "Sum of eigenvalues = ?", answer: "Trace of A.", solution: "Standard." }
          ]
        },
        {
          title: "Eigenvectors",
          questions: [
            { type: "regular", q: "Eigenvector v for eigenvalue λ satisfies?", answer: "\\(Av = \\lambda v\\).", solution: "Definition." },
            { type: "regular", q: "Zero vector is an eigenvector?", answer: "No.", solution: "Excluded by convention." },
            { type: "regular", q: "Eigenvector of identity for λ=1?", answer: "Any nonzero vector.", solution: "Standard." },
            { type: "regular", q: "Eigenspace = ?", answer: "Null space of \\(A - \\lambda I\\).", solution: "Standard." },
            { type: "word", q: "If \\(Av = 3v\\), v is eigenvector for?", answer: "\\(\\lambda = 3\\).", solution: "Definition." }
          ]
        },
        {
          title: "Diagonalization",
          questions: [
            { type: "regular", q: "A diagonalizable means?", answer: "\\(A = PDP^{-1}\\) for some D diagonal.", solution: "Standard." },
            { type: "regular", q: "Need how many independent eigenvectors?", answer: "n.", solution: "For n×n matrix." },
            { type: "regular", q: "D contains?", answer: "Eigenvalues on diagonal.", solution: "Standard." },
            { type: "regular", q: "P contains?", answer: "Corresponding eigenvectors as columns.", solution: "Standard." },
            { type: "word", q: "Powers \\(A^k\\) easy when diagonalized: ?", answer: "\\(PD^kP^{-1}\\).", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Eigenvalues",
        questions: [
          { type: "regular", q: "Eigenvalue equation?", answer: "\\(Av = \\lambda v\\).", solution: "Standard." },
          { type: "regular", q: "Characteristic equation?", answer: "\\(\\det(A - \\lambda I) = 0\\).", solution: "Standard." },
          { type: "regular", q: "Eigenvalues of \\(\\begin{pmatrix}5&0\\\\0&-2\\end{pmatrix}\\)?", answer: "5, −2.", solution: "Diagonal." },
          { type: "regular", q: "A diagonalizable means?", answer: "\\(A = PDP^{-1}\\).", solution: "Standard." },
          { type: "word", q: "Sum of eigenvalues equals?", answer: "Trace.", solution: "Standard." },
          { type: "word", q: "Product of eigenvalues equals?", answer: "Determinant.", solution: "Standard." }
        ]
      }
    }
  ]
};
