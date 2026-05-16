// Geometry course data — mirrors the High School Geometry Curriculum units.
const GEOMETRY_COURSE = {
  id: "geometry",
  title: "Geometry",
  subtitle: "Shapes, space, proofs, and trigonometry",
  emoji: "🔷",
  accent: "#6a8f6a",
  accent2: "#a8c09a",
  description: "Ten units from the foundations of geometry through trigonometry, volume, probability, and circles.",
  books: [
    {
      id: "g1", num: 1,
      title: "Basics of Geometry",
      subtitle: "Points, segments, angles",
      emoji: "📍",
      accent: "#6a8f6a", accent2: "#a8c09a",
      sections: [
        {
          title: "Points, Lines, and Planes",
          questions: [
            { type: "regular", q: "How many points are needed to determine a line?", answer: "2.", solution: "Two distinct points define a unique line." },
            { type: "regular", q: "What is the intersection of two distinct planes (if they intersect)?", answer: "A line.", solution: "When two planes meet, they share a line." },
            { type: "word", q: "A table top meets a wall. What geometric object represents their intersection?", answer: "A line segment (or a line).", solution: "Two planes intersect in a line." }
          ]
        },
        {
          title: "Segments, Midpoints, Distance",
          questions: [
            { type: "regular", q: "Find the midpoint of the segment from \\((2, 4)\\) to \\((10, 8)\\).", answer: "\\((6, 6)\\).", solution: "Average the coordinates: \\(\\left(\\frac{2+10}{2}, \\frac{4+8}{2}\\right)\\)." },
            { type: "regular", q: "Find the distance between \\((1, 2)\\) and \\((4, 6)\\).", answer: "5.", solution: "\\(\\sqrt{(4-1)^2 + (6-2)^2} = \\sqrt{9+16} = 5\\)." },
            { type: "word", q: "A park has a fountain at \\((3, 5)\\) and a bench at \\((9, 13)\\). What's the distance between them?", answer: "10 units.", solution: "\\(\\sqrt{36 + 64} = 10\\)." }
          ]
        },
        {
          title: "Angles and Angle Pairs",
          questions: [
            { type: "regular", q: "Two angles are complementary. One measures \\(37°\\). What's the other?", answer: "\\(53°\\).", solution: "Complementary angles sum to \\(90°\\)." },
            { type: "regular", q: "Two angles form a linear pair. One is \\(115°\\). Find the other.", answer: "\\(65°\\).", solution: "Linear pairs sum to \\(180°\\)." },
            { type: "word", q: "A door opens to an angle of \\(72°\\). What's the supplement of this angle?", answer: "\\(108°\\).", solution: "\\(180° - 72° = 108°\\)." }
          ]
        }
      ]
    },
    {
      id: "g2", num: 2,
      title: "Parallel & Perpendicular Lines",
      subtitle: "Transversals and slopes",
      emoji: "║",
      accent: "#5b8da8", accent2: "#9fbfd1",
      sections: [
        {
          title: "Parallel Lines and Transversals",
          questions: [
            { type: "regular", q: "Two parallel lines are cut by a transversal. If one alternate interior angle is \\(64°\\), find the other.", answer: "\\(64°\\).", solution: "Alternate interior angles are congruent." },
            { type: "regular", q: "Co-interior (same-side interior) angles on parallel lines sum to what?", answer: "\\(180°\\).", solution: "They are supplementary." },
            { type: "word", q: "A ladder leans across two parallel beams, making a \\(112°\\) angle with the top beam. What angle does it make with the bottom beam on the same side?", answer: "\\(68°\\).", solution: "Co-interior angles sum to \\(180°\\)." }
          ]
        },
        {
          title: "Slopes of Parallel and Perpendicular Lines",
          questions: [
            { type: "regular", q: "Line \\(\\ell\\) has slope \\(3\\). What's the slope of a line parallel to \\(\\ell\\)?", answer: "3.", solution: "Parallel lines share the same slope." },
            { type: "regular", q: "Line \\(m\\) has slope \\(-\\tfrac{2}{5}\\). Slope of a line perpendicular to \\(m\\)?", answer: "\\(\\tfrac{5}{2}\\).", solution: "Perpendicular slopes are negative reciprocals." },
            { type: "word", q: "A road has slope \\(\\tfrac{1}{4}\\). A driveway runs perpendicular to it. What's the driveway's slope?", answer: "\\(-4\\).", solution: "Flip and change sign." }
          ]
        },
        {
          title: "Proving Lines Parallel",
          questions: [
            { type: "regular", q: "If corresponding angles formed by a transversal are congruent, what can you conclude?", answer: "The two lines are parallel.", solution: "Converse of the corresponding angles postulate." },
            { type: "regular", q: "Two lines cut by a transversal have alternate interior angles of \\(45°\\) and \\(50°\\). Are they parallel?", answer: "No.", solution: "Parallel requires the alternate interior angles to be equal." },
            { type: "word", q: "A carpenter sees that two boards cut by a crossbeam make congruent alternate exterior angles. What does this prove about the boards?", answer: "They are parallel.", solution: "Converse of alternate exterior angles theorem." }
          ]
        }
      ]
    },
    {
      id: "g3", num: 3,
      title: "Transformations",
      subtitle: "Translations, reflections, rotations, dilations",
      emoji: "🔄",
      accent: "#a07fa8", accent2: "#c9b3cf",
      sections: [
        {
          title: "Translations and Reflections",
          questions: [
            { type: "regular", q: "Translate the point \\((3, -2)\\) by \\(\\langle 4, 5 \\rangle\\).", answer: "\\((7, 3)\\).", solution: "Add the vector: \\((3+4, -2+5)\\)." },
            { type: "regular", q: "Reflect \\((5, -3)\\) over the x-axis.", answer: "\\((5, 3)\\).", solution: "Reflecting over the x-axis negates the y-coordinate." },
            { type: "word", q: "A chess knight at \\((2, 3)\\) moves \\(1\\) right and \\(2\\) up. Where is it now?", answer: "\\((3, 5)\\).", solution: "Translation by \\(\\langle 1, 2 \\rangle\\)." }
          ]
        },
        {
          title: "Rotations",
          questions: [
            { type: "regular", q: "Rotate \\((4, 0)\\) by \\(90°\\) counterclockwise about the origin.", answer: "\\((0, 4)\\).", solution: "\\(90°\\) CCW: \\((x, y) \\to (-y, x)\\)." },
            { type: "regular", q: "Rotate \\((3, 2)\\) by \\(180°\\) about the origin.", answer: "\\((-3, -2)\\).", solution: "\\((x, y) \\to (-x, -y)\\)." },
            { type: "word", q: "A Ferris wheel seat at position \\((5, 0)\\) rotates \\(90°\\) CCW about the center. New position?", answer: "\\((0, 5)\\).", solution: "\\(90°\\) CCW rule." }
          ]
        },
        {
          title: "Dilations",
          questions: [
            { type: "regular", q: "Dilate the point \\((2, 3)\\) by scale factor \\(4\\) about the origin.", answer: "\\((8, 12)\\).", solution: "Multiply coordinates by 4." },
            { type: "regular", q: "A dilation with scale factor \\(\\tfrac{1}{2}\\) enlarges or shrinks?", answer: "Shrinks.", solution: "Scale factor less than 1 shrinks the figure." },
            { type: "word", q: "A photo of size \\(4 \\times 6\\) is enlarged by scale factor \\(3\\). New dimensions?", answer: "\\(12 \\times 18\\).", solution: "Multiply each side by the scale factor." }
          ]
        }
      ]
    },
    {
      id: "g4", num: 4,
      title: "Congruent Triangles",
      subtitle: "SSS, SAS, ASA, AAS",
      emoji: "🔺",
      accent: "#c27b5c", accent2: "#e2a985",
      sections: [
        {
          title: "Classifying Triangles",
          questions: [
            { type: "regular", q: "A triangle has angles \\(45°, 45°, 90°\\). Classify it by angles and sides.", answer: "Right isosceles.", solution: "One right angle, two equal legs." },
            { type: "regular", q: "A triangle with sides \\(7, 7, 7\\) is classified as?", answer: "Equilateral (and equiangular).", solution: "All sides equal → all angles \\(60°\\)." },
            { type: "word", q: "A plot of land has angles \\(80°, 60°, 40°\\). Classify the triangle by angles.", answer: "Acute.", solution: "All angles less than \\(90°\\)." }
          ]
        },
        {
          title: "Congruence Postulates (SSS, SAS, ASA, AAS)",
          questions: [
            { type: "regular", q: "Two triangles have three pairs of congruent sides. Which postulate proves them congruent?", answer: "SSS.", solution: "Side-Side-Side." },
            { type: "regular", q: "If two angles and the included side of one triangle equal those of another, which postulate applies?", answer: "ASA.", solution: "Angle-Side-Angle." },
            { type: "word", q: "Two triangular sails have two equal angles and a non-included side of matching length. What proves them congruent?", answer: "AAS.", solution: "Angle-Angle-Side." }
          ]
        },
        {
          title: "Isosceles and Equilateral Triangles",
          questions: [
            { type: "regular", q: "An isosceles triangle has a vertex angle of \\(40°\\). Find each base angle.", answer: "\\(70°\\).", solution: "Base angles are equal; \\((180 - 40)/2 = 70\\)." },
            { type: "regular", q: "What's the measure of each angle in an equilateral triangle?", answer: "\\(60°\\).", solution: "\\(180° / 3\\)." },
            { type: "word", q: "An isosceles triangular roof has two base angles of \\(75°\\) each. Find the peak angle.", answer: "\\(30°\\).", solution: "\\(180° - 2(75°) = 30°\\)." }
          ]
        }
      ]
    },
    {
      id: "g5", num: 5,
      title: "Quadrilaterals & Polygons",
      subtitle: "Parallelograms, rhombi, and more",
      emoji: "⬛",
      accent: "#b58a3a", accent2: "#d8b870",
      sections: [
        {
          title: "Interior and Exterior Angles of Polygons",
          questions: [
            { type: "regular", q: "Sum of interior angles of a hexagon?", answer: "\\(720°\\).", solution: "\\((6-2) \\cdot 180° = 720°\\)." },
            { type: "regular", q: "Each exterior angle of a regular pentagon?", answer: "\\(72°\\).", solution: "\\(360° / 5\\)." },
            { type: "word", q: "A regular polygon has each interior angle equal to \\(150°\\). How many sides?", answer: "12.", solution: "Each exterior \\(= 30°\\); \\(360/30 = 12\\)." }
          ]
        },
        {
          title: "Parallelograms",
          questions: [
            { type: "regular", q: "In parallelogram \\(ABCD\\), \\(\\angle A = 70°\\). Find \\(\\angle C\\).", answer: "\\(70°\\).", solution: "Opposite angles of a parallelogram are congruent." },
            { type: "regular", q: "Diagonals of a parallelogram always do what?", answer: "Bisect each other.", solution: "This is a property of all parallelograms." },
            { type: "word", q: "A parallelogram-shaped picture frame has one side \\(12\\) cm. What's the length of the opposite side?", answer: "\\(12\\) cm.", solution: "Opposite sides of a parallelogram are congruent." }
          ]
        },
        {
          title: "Rhombi, Rectangles, Squares, Trapezoids",
          questions: [
            { type: "regular", q: "What kind of parallelogram has perpendicular diagonals?", answer: "Rhombus (and square).", solution: "Rhombus diagonals are perpendicular." },
            { type: "regular", q: "Midsegment of a trapezoid with bases \\(8\\) and \\(14\\)?", answer: "\\(11\\).", solution: "Average: \\((8 + 14)/2 = 11\\)." },
            { type: "word", q: "A rectangular field has diagonals. What do you know about them?", answer: "They are congruent and bisect each other.", solution: "Rectangle diagonals are equal in length." }
          ]
        }
      ]
    },
    {
      id: "g6", num: 6,
      title: "Similarity",
      subtitle: "Ratios, proportions, similar figures",
      emoji: "🔍",
      accent: "#7d77b4", accent2: "#adaad0",
      sections: [
        {
          title: "Ratios and Proportions",
          questions: [
            { type: "regular", q: "Solve: \\(\\dfrac{3}{5} = \\dfrac{x}{20}\\).", answer: "\\(x = 12\\).", solution: "Cross multiply: \\(5x = 60\\)." },
            { type: "regular", q: "Simplify the ratio \\(18 : 24\\).", answer: "\\(3 : 4\\).", solution: "Divide both by GCD 6." },
            { type: "word", q: "A recipe uses 2 cups of flour for every 3 cups of milk. How much flour for 12 cups of milk?", answer: "8 cups.", solution: "\\(\\frac{2}{3} = \\frac{x}{12}\\); \\(x = 8\\)." }
          ]
        },
        {
          title: "Similar Triangles",
          questions: [
            { type: "regular", q: "If \\(\\triangle ABC \\sim \\triangle DEF\\) and \\(AB = 6\\), \\(DE = 9\\), what's the scale factor from \\(ABC\\) to \\(DEF\\)?", answer: "\\(\\tfrac{3}{2}\\).", solution: "\\(9/6 = 3/2\\)." },
            { type: "regular", q: "Which theorem shows two triangles similar if two angles match?", answer: "AA (Angle-Angle).", solution: "Two congruent angles force the third to match, so triangles are similar." },
            { type: "word", q: "A tree casts a \\(15\\)-ft shadow while a \\(5\\)-ft person casts a \\(3\\)-ft shadow. How tall is the tree?", answer: "25 ft.", solution: "\\(\\frac{5}{3} = \\frac{h}{15}\\); \\(h = 25\\)." }
          ]
        },
        {
          title: "Similar Polygons",
          questions: [
            { type: "regular", q: "Two similar rectangles have sides \\(4, 6\\) and \\(6, x\\). Find \\(x\\).", answer: "9.", solution: "\\(\\frac{4}{6} = \\frac{6}{x}\\); \\(x = 9\\)." },
            { type: "regular", q: "If the scale factor is \\(2\\), how do areas compare?", answer: "Larger area is \\(4\\times\\) bigger.", solution: "Area ratio = (scale factor)^2." },
            { type: "word", q: "Two similar floor plans have scale factor \\(3\\). If the small plan has area \\(50\\) sq ft, what's the big plan's area?", answer: "\\(450\\) sq ft.", solution: "\\(50 \\cdot 3^2 = 450\\)." }
          ]
        }
      ]
    },
    {
      id: "g7", num: 7,
      title: "Right Triangles & Trigonometry",
      subtitle: "Pythagoras, special triangles, sin/cos/tan",
      emoji: "📏",
      accent: "#bc6060", accent2: "#d99494",
      sections: [
        {
          title: "Pythagorean Theorem",
          questions: [
            { type: "regular", q: "Find the hypotenuse of a right triangle with legs \\(9\\) and \\(12\\).", answer: "15.", solution: "\\(\\sqrt{81 + 144} = 15\\)." },
            { type: "regular", q: "A right triangle has hypotenuse \\(17\\) and one leg \\(8\\). Find the other leg.", answer: "15.", solution: "\\(\\sqrt{17^2 - 8^2} = \\sqrt{225} = 15\\)." },
            { type: "word", q: "A ladder \\(13\\) ft long rests against a wall, its base \\(5\\) ft out. How high does it reach?", answer: "12 ft.", solution: "\\(\\sqrt{169 - 25} = 12\\)." }
          ]
        },
        {
          title: "Special Right Triangles",
          questions: [
            { type: "regular", q: "In a \\(45°\\text{-}45°\\text{-}90°\\) triangle with legs \\(7\\), find the hypotenuse.", answer: "\\(7\\sqrt{2}\\).", solution: "Hypotenuse = leg × \\(\\sqrt{2}\\)." },
            { type: "regular", q: "In a \\(30°\\text{-}60°\\text{-}90°\\) triangle with short leg \\(5\\), find the long leg and hypotenuse.", answer: "Long leg \\(5\\sqrt{3}\\), hypotenuse \\(10\\).", solution: "Sides are in ratio \\(1 : \\sqrt{3} : 2\\)." },
            { type: "word", q: "A square has a diagonal of \\(10\\) m. Find its side length.", answer: "\\(5\\sqrt{2}\\) m.", solution: "Diagonal = side × \\(\\sqrt{2}\\); side = \\(10/\\sqrt{2} = 5\\sqrt{2}\\)." }
          ]
        },
        {
          title: "Trigonometric Ratios",
          questions: [
            { type: "regular", q: "In a right triangle, opposite = 3, adjacent = 4, hypotenuse = 5. Find \\(\\sin\\theta\\).", answer: "\\(\\tfrac{3}{5}\\).", solution: "\\(\\sin = \\text{opp}/\\text{hyp}\\)." },
            { type: "regular", q: "Find \\(\\tan\\theta\\) if opposite = 7 and adjacent = 24.", answer: "\\(\\tfrac{7}{24}\\).", solution: "\\(\\tan = \\text{opp}/\\text{adj}\\)." },
            { type: "word", q: "A ramp rises \\(3\\) ft over a \\(12\\)-ft run. What's the angle of elevation (to the nearest degree)?", answer: "\\(\\approx 14°\\).", solution: "\\(\\tan\\theta = 3/12\\); \\(\\theta = \\arctan(0.25) \\approx 14°\\)." }
          ]
        }
      ]
    },
    {
      id: "g8", num: 8,
      title: "Area, Surface Area & Volume",
      subtitle: "Measuring 2D and 3D figures",
      emoji: "📦",
      accent: "#5a8d88", accent2: "#97b9b5",
      sections: [
        {
          title: "Area of 2D Figures",
          questions: [
            { type: "regular", q: "Area of a triangle with base \\(10\\) and height \\(7\\)?", answer: "35.", solution: "\\(\\tfrac{1}{2}(10)(7) = 35\\)." },
            { type: "regular", q: "Area of a circle with radius \\(6\\)?", answer: "\\(36\\pi\\).", solution: "\\(\\pi r^2\\)." },
            { type: "word", q: "A rectangular garden is \\(15\\) ft by \\(8\\) ft. What's its area?", answer: "\\(120\\) sq ft.", solution: "\\(15 \\times 8\\)." }
          ]
        },
        {
          title: "Surface Area of Solids",
          questions: [
            { type: "regular", q: "Surface area of a cube with edge \\(5\\)?", answer: "\\(150\\).", solution: "\\(6 \\cdot 5^2 = 150\\)." },
            { type: "regular", q: "Surface area of a sphere with radius \\(3\\)?", answer: "\\(36\\pi\\).", solution: "\\(4\\pi r^2 = 4\\pi(9)\\)." },
            { type: "word", q: "A cylindrical can has radius \\(2\\) and height \\(10\\). Find its total surface area.", answer: "\\(48\\pi\\).", solution: "\\(2\\pi r^2 + 2\\pi r h = 8\\pi + 40\\pi = 48\\pi\\)." }
          ]
        },
        {
          title: "Volume of Solids",
          questions: [
            { type: "regular", q: "Volume of a rectangular prism \\(4 \\times 5 \\times 6\\)?", answer: "120.", solution: "\\(l \\cdot w \\cdot h\\)." },
            { type: "regular", q: "Volume of a cone with radius \\(3\\) and height \\(5\\)?", answer: "\\(15\\pi\\).", solution: "\\(\\tfrac{1}{3}\\pi r^2 h = \\tfrac{1}{3}\\pi(9)(5)\\)." },
            { type: "word", q: "A spherical water tank has radius \\(6\\) ft. Find its volume.", answer: "\\(288\\pi\\) cubic ft.", solution: "\\(\\tfrac{4}{3}\\pi r^3 = \\tfrac{4}{3}\\pi(216) = 288\\pi\\)." }
          ]
        }
      ]
    },
    {
      id: "g9", num: 9,
      title: "Probability",
      subtitle: "Likelihood and counting",
      emoji: "🎲",
      accent: "#c29449", accent2: "#e3be85",
      sections: [
        {
          title: "Basic Probability",
          questions: [
            { type: "regular", q: "Probability of rolling a \\(4\\) on a fair die?", answer: "\\(\\tfrac{1}{6}\\).", solution: "One favorable out of six equally likely." },
            { type: "regular", q: "Probability of drawing a heart from a standard deck?", answer: "\\(\\tfrac{1}{4}\\).", solution: "13 hearts / 52 cards." },
            { type: "word", q: "A bag holds 4 red, 3 blue, 5 green marbles. Probability of drawing a blue?", answer: "\\(\\tfrac{3}{12} = \\tfrac{1}{4}\\).", solution: "3 favorable out of 12 total." }
          ]
        },
        {
          title: "Compound Events",
          questions: [
            { type: "regular", q: "Two independent events \\(A\\) and \\(B\\) have \\(P(A) = 0.3\\), \\(P(B) = 0.4\\). Find \\(P(A \\text{ and } B)\\).", answer: "0.12.", solution: "Multiply independent probabilities." },
            { type: "regular", q: "Two mutually exclusive events: \\(P(A) = 0.2\\), \\(P(B) = 0.5\\). Find \\(P(A \\text{ or } B)\\).", answer: "0.7.", solution: "Add when mutually exclusive." },
            { type: "word", q: "You flip two fair coins. Probability of getting two heads?", answer: "\\(\\tfrac{1}{4}\\).", solution: "Independent: \\(\\tfrac{1}{2} \\cdot \\tfrac{1}{2}\\)." }
          ]
        },
        {
          title: "Conditional Probability",
          questions: [
            { type: "regular", q: "\\(P(A) = 0.6\\), \\(P(A \\text{ and } B) = 0.24\\). Find \\(P(B | A)\\).", answer: "0.4.", solution: "\\(P(B|A) = P(A \\cap B)/P(A) = 0.24 / 0.6\\)." },
            { type: "regular", q: "Drawing 2 cards without replacement: probability both are aces?", answer: "\\(\\tfrac{1}{221}\\).", solution: "\\(\\frac{4}{52} \\cdot \\frac{3}{51} = \\frac{12}{2652} = \\frac{1}{221}\\)." },
            { type: "word", q: "In a class of 30 students, 18 play soccer and 12 are girls. 8 are girls who play soccer. Given a student is a girl, probability she plays soccer?", answer: "\\(\\tfrac{8}{12} = \\tfrac{2}{3}\\).", solution: "\\(P(\\text{soccer}|\\text{girl}) = 8/12\\)." }
          ]
        }
      ]
    },
    {
      id: "g10", num: 10,
      title: "Circles",
      subtitle: "Arcs, chords, tangents, inscribed angles",
      emoji: "⭕",
      accent: "#566fb0", accent2: "#97a7d3",
      sections: [
        {
          title: "Circle Basics",
          questions: [
            { type: "regular", q: "Circumference of a circle with radius \\(5\\)?", answer: "\\(10\\pi\\).", solution: "\\(C = 2\\pi r\\)." },
            { type: "regular", q: "If the diameter of a circle is \\(14\\), what's its radius?", answer: "7.", solution: "Radius is half the diameter." },
            { type: "word", q: "A wheel has radius \\(12\\) inches. How far does it travel in one rotation?", answer: "\\(24\\pi\\) inches.", solution: "Circumference \\(= 2\\pi(12)\\)." }
          ]
        },
        {
          title: "Arcs and Central Angles",
          questions: [
            { type: "regular", q: "In a circle, a central angle measures \\(72°\\). Find the measure of its intercepted arc.", answer: "\\(72°\\).", solution: "Central angle equals its intercepted arc." },
            { type: "regular", q: "Length of an arc subtending \\(90°\\) in a circle of radius \\(8\\)?", answer: "\\(4\\pi\\).", solution: "Arc length = \\(\\frac{90}{360} \\cdot 2\\pi(8) = 4\\pi\\)." },
            { type: "word", q: "A pizza is cut into 8 equal slices. What's the central angle of each slice?", answer: "\\(45°\\).", solution: "\\(360°/8\\)." }
          ]
        },
        {
          title: "Inscribed Angles and Tangents",
          questions: [
            { type: "regular", q: "An inscribed angle intercepts an arc of \\(80°\\). Find the inscribed angle's measure.", answer: "\\(40°\\).", solution: "Inscribed angle = half the intercepted arc." },
            { type: "regular", q: "A tangent meets a radius at the point of tangency at what angle?", answer: "\\(90°\\).", solution: "Tangent \\(\\perp\\) radius at point of tangency." },
            { type: "word", q: "A quarterback throws from outside a circle, and the chord formed subtends an arc of \\(120°\\) on the far side. What's the inscribed angle from any far-side point?", answer: "\\(60°\\).", solution: "Half of \\(120°\\)." }
          ]
        }
      ]
    }
  ]
};
