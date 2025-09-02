// Utility to analyze CSV data for IEP goals
export interface CSVStudent {
  seisId: string;
  districtId: string;
  lastName: string;
  firstName: string;
  birthdate: string;
  grade: string;
  schoolOfAttendance: string;
  districtOfService: string;
  caseManager: string;
  iepDate: string;
  eligibilityStatus: string;
  areaOfNeed: string;
  annualGoalNumber: string;
  baseline: string;
  goal: string;
  purposeOfGoal: string;
  standard: string;
  personResponsible: string;
}

// Based on CSV analysis, here are the Grade 7 students with math goals
// excluding case managers: Lyndsey Hightower, Robert Hurlburt, Jason McNie
export const FILTERED_STUDENTS = [
  {
    seisId: "2209884",
    firstName: "Justice",
    lastName: "Buckner",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math 2025-2026",
        goalNumber: "Academic #3 2025-2026",
        baseline: "Given a composite shape composed of 3 or more triangles and special quadrilaterals with rational number side lengths, Justice will write the area of the figure by composing or decomposing it into basic shapes, finding the areas of those shapes, and adding or subtracting to get a total area, for 1 out of 5 composite shapes, on 3 out of 4 progress monitoring assessments.",
        goal: "By April 2026, given a composite shape composed of 3 or more triangles and special quadrilaterals with rational number side lengths, Justice will write the area of the figure by composing or decomposing it into basic shapes, finding the areas of those shapes, and adding or subtracting to get a total area, for 4 out of 5 composite shapes, on 3 out of 4 progress monitoring assessments.",
        standard: "6.G.1 Solve real-world and mathematical problems involving area, surface area, and volume"
      },
      {
        areaOfNeed: "Math 2025-2026",
        goalNumber: "Academic #4 2025-2026",
        baseline: "When given a one- or two-step equation (e.g. 2x = 12; 3x - 4 = 11 ) with whole numbers, Justice will solve for the variable using visual or arithmetic strategies (e.g. equation mat with algebra tiles, algebraically with inverse operations) with 40% accuracy (i.e. 2 out of 5 problems correct) for 2 out of 3 sets of problems.",
        goal: "By April 2026, when given a one- or two-step equation (e.g. 2x = 12; 3x - 4 = 11 ) with whole numbers, Justice will solve for the variable using visual or arithmetic strategies (e.g. equation mat with algebra tiles, algebraically with inverse operations) with 80% accuracy (i.e. 4 out of 5 problems correct) for 2 out of 3 sets of problems.",
        standard: "6.EE.7 Reason about and solve one-variable equations and inequalities"
      }
    ]
  },
  {
    seisId: "1483650",
    firstName: "Mason",
    lastName: "Demuth",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Expressions and Equations",
        goalNumber: "01",
        baseline: "Following teacher modeling, given a word problem that can be modeled by a one-step equation involving whole numbers and a problem solving checklist, Mason can calculate the solution by writing an equation for 2 out of 3 word problems.",
        goal: "By 5/20/2026, when given a two-step linear equation using rational numbers, Mason will determine the necessary steps in order to correctly solve the problem with 80% accuracy in 2 of 3 trials as measured by student work samples/teacher records.",
        standard: "7.EE.4a Solve real-life and mathematical problems using numerical and algebraic expressions and equations."
      }
    ]
  },
  {
    seisId: "2216794",
    firstName: "Lexee",
    lastName: "Chatfield",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "2",
        baseline: "In math, Lexee was able to solve addition problems with and without regrouping with 80% accuracy, subtraction problems with and without regrouping with 100% accuracy, multiplication 2 digit by 1 digit with 100% accuracy, multiplication 2 digit by 2 digit with 90% accuracy, and single digit division with 60% accuracy. She was able to solve math reasoning problems involving addition and subtraction problems involving regrouping with 100% accuracy. She was able to solve math reasoning problems involving multiplication and division problems with 50% accuracy. Division is a challenge for her.",
        goal: "By 3/4/2026, Lexee will be able to use all operations to solve math words problems involving rational numbers with 80% accuracy or greater in 2 of 3 trials as measured by work samples and/or tests.",
        standard: "CCSS.Math.Content.6.NS.A.1"
      }
    ]
  },
  {
    seisId: "1571594",
    firstName: "Brodee",
    lastName: "Foster",
    grade: "07",
    caseManager: "Tony Delgado",
    goals: [
      {
        areaOfNeed: "Integer Properties",
        goalNumber: "Math #1",
        baseline: "Currently struggles with simplifying integers: 30% accuracy",
        goal: "By 10/2025, given the use of a multiplication table, Brodee will solve real-world and mathematical problems involving the four operations with rational numbers with at least 80% accuracy in 2/3 trials as measured by student work samples/teacher records.",
        standard: "7.NS.3"
      }
    ]
  },
  {
    seisId: "2107809",
    firstName: "Jazmine",
    lastName: "Herrera",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "25/26 RSP #3",
        baseline: "Jazmine has difficulty with math concepts, primarily due to challenges with number sense. She struggles to understand the question and has difficulty with standard algorithms, estimation, and checking for reasonableness.",
        goal: "By 2/24/25, when given a word problem involving any of the four operations, Jazmine will first estimate the answer and then calculate the solution, for 3 out of 4 problems, on 3 out of 4 progress monitoring assessments.",
        standard: "6.NS.5 Apply and extend previous understandings of numbers to the system of rational numbers"
      }
    ]
  },
  {
    seisId: "2570001",
    firstName: "Dylan",
    lastName: "Hoffman",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math 2024-2025",
        goalNumber: "Academic #3 2024-2025",
        baseline: "Given an addition or subtraction problem of two fractions (e.g., proper or improper fractions, mixed numbers) with unlike denominators (e.g., 1 2/4 + 3/5), Dylan can calculate the sum or difference by generating equivalent fractions (e.g., representing the problem, finding the least common denominator), for 0 out of 5 problems, on 3 out of 4 progress monitoring assessments.",
        goal: "By October 2025, given an addition or subtraction problem of two fractions (e.g., proper or improper fractions, mixed numbers) with unlike denominators (e.g., 1 2/4 + 3/5), Dylan will calculate the sum or difference by generating equivalent fractions (e.g., representing the problem, finding the least common denominator), for 4 out of 5 problems, on 3 out of 4 progress monitoring assessments.",
        standard: "5.NF.1"
      },
      {
        areaOfNeed: "Math 2024-2025",
        goalNumber: "Academic #4 2024-2025",
        baseline: "Given a division problem with dividends within two digits and divisors within one digit, Dylan can determine the quotient by using a division strategy (e.g., place value strategies, properties of operations, the relationship between division and multiplication), for 1 out of 5 problems, on 3 out of 4 progress monitoring assessments.",
        goal: "By October 2025, given a division problem with dividends within four digits and divisors within three digits, Dylan will determine the quotient by using a division strategy (e.g., place value strategies, properties of operations, the relationship between division and multiplication), for 4 out of 5 problems, on 3 out of 4 progress monitoring assessments.",
        standard: "5.NBT.6"
      }
    ]
  },
  {
    seisId: "2034682",
    firstName: "Lauriano",
    lastName: "Jimenez",
    grade: "07",
    caseManager: "Jonathan Davis",
    goals: [] // No math goals found for this student
  },
  {
    seisId: "2082406",
    firstName: "Jaime",
    lastName: "Jimenez Reyes",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "25/26 RSP #1",
        baseline: "Jaime scored with in the very low range on the broad mathematics test (57), and the applied problem subtest (65).",
        goal: "By 6/3/26, When given a multi-step word problem, Jaime will identify relevant information, choose an appropriate operation, and solve the problem with 80% accuracy in 4 out of 5 trials.",
        standard: "7.NS.A.1 – Apply and extend previous understandings of addition and subtraction to add and subtract rational numbers."
      }
    ]
  },
  {
    seisId: "2524279",
    firstName: "Ricardo",
    lastName: "Martinez",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [] // No math goals found for this student
  },
  {
    seisId: "2395500",
    firstName: "Aubree",
    lastName: "Morris",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math 2025-2026",
        goalNumber: "Academic #3 2025-2026",
        baseline: "Given an equation with two multi-digit decimal numbers up to the hundredths place, Aubree will calculate the solution by adding, subtracting, multiplying, or dividing, for 2 out of 5 equations, on 3 out of 4 progress monitoring assessments.",
        goal: "By April 6, 2026, given an equation with two multi-digit decimal numbers up to the hundredths place, Aubree will calculate the solution by adding, subtracting, multiplying, or dividing, for 4 out of 5 equations, on 3 out of 4 progress monitoring assessments.",
        standard: "5.NBT.7 Perform operations with multi-digit whole numbers and with decimals to hundredths"
      },
      {
        areaOfNeed: "Math 2025-2026",
        goalNumber: "Academic #4 2025-2026",
        baseline: "Given three rational numbers, Aubree can order the absolute values of the numbers from least to greatest or greatest to least by analyzing the relative position of each number from 0, for 2 out of 5 problems, on 3 out of 4 progress monitoring assessments.",
        goal: "By April 6, 2026, given three rational numbers, Aubree will order the absolute values of the numbers from least to greatest or greatest to least by analyzing the relative position of each number from 0, for 4 out of 5 problems, on 3 out of 4 progress monitoring assessments.",
        standard: "6.NS.7 Apply and extend previous understandings of numbers to the system of rational numbers"
      }
    ]
  },
  {
    seisId: "2114352",
    firstName: "Jayden",
    lastName: "Mobley",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math: Multiplication",
        goalNumber: "RSP #4",
        baseline: "Jayden is able to solve 2 digit by 2 digit multiplication problems for 5 out of 10 problems. She struggles with the steps of multiplying 2 digit numbers.",
        goal: "By 02/09/2026, given a multiplication problem involving two and three- digit numbers (e.g., 67 x 21, 244 x 17) and a worked example of each, Jayden will write the product by using a multiplication strategy, for (4 out of 5) problems, on 2 out of 3 student work samples",
        standard: "6.NS.3 Compute fluently with multi-digit numbers and find common factors and multiples"
      },
      {
        areaOfNeed: "Math: Addition and Subtraction with regrouping",
        goalNumber: "RSP #5",
        baseline: "When given 10 three digit subtraction equations with regrouping, and visual support strategies and/or tools, Jayden is able to solve 6/10 problems correctly.",
        goal: "By 02/09/2026, when given 4 equations involving addition and subtraction of one whole number with three digits and one multi digit decimal number, Jayden will solve by using the standard algorithm with 80% accuracy (4 out of 5 correct) on 2 out of 3 student work samples.",
        standard: "6.NS.3 Compute fluently with multi-digit numbers and find common factors and multiples"
      }
    ]
  },
  {
    seisId: "1536466",
    firstName: "Rebecca",
    lastName: "Morgan",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "RSP #4",
        baseline: "Rebecca is able to write an algebraic expression by translating the verbal phrase into an algebraic representation for 1 out of 5 problems.",
        goal: "By 05/19/2026, With functioning amplification, when given a statement representing an expression (e.g., four minus the product of three and a number x), Rebecca will write the related algebraic expression (e.g., 4 - 3x) by translating the verbal phrase into an algebraic representation, for 4 out of 5 statements, on 3 out of 4 progress monitoring assessments.",
        standard: "6.EE.7 Reason about and solve one-variable equations and inequalities"
      }
    ]
  },
  {
    seisId: "2127766",
    firstName: "Aubrey",
    lastName: "Murtishaw",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "RSP #2 25'-26'",
        baseline: "Aubrey is able to translate the verbal phrase of an algebraic expression into an algebraic representation for 0 out of 5 statements.",
        goal: "By 05/21/2026, given a verbal statement representing an expression (e.g., four minus the product of three and a number x), Aubrey will write the related algebraic expression (e.g., 4 - 3x) by translating the verbal phrase into an algebraic representation, for 4 out of 5 statements, on 3 out of 4 progress monitoring assessments.",
        standard: "6.EE.2a Apply and extend previous understandings of arithmetic to algebraic expressions"
      },
      {
        areaOfNeed: "Math",
        goalNumber: "RSP #3 25'-26'",
        baseline: "Aubrey is able to solve 4 out of 10 multi digit subtraction problems with adult prompting and questions.",
        goal: "By 05/21/2026, given a subtraction equation involving numbers with three digits, Aubrey will write the solution by subtracting using a fluent computation strategy based on place value, with guiding questions (e.g., 'How do you know which number to place on top?'), for 4 out of 5 problems, on 3 out of 4 progress monitoring assessments.",
        standard: "6.NS.3 Compute fluently with multi-digit numbers and find common factors and multiples"
      }
    ]
  },
  {
    seisId: "1651426",
    firstName: "Kash",
    lastName: "Padilla",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [] // No math goals found for this student
  },
  {
    seisId: "1538003",
    firstName: "Antoinette",
    lastName: "Peregrina",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "3",
        baseline: "Antoinette was able to use all operations to solve math word problems involving whole numbers with 65% and 60% accuracy in two consecutive trials.",
        goal: "By 4/8/2026, Antoinette will be able to use all operations to solve math words problems involving rational numbers with 80% accuracy or greater in 2 of 3 trials as measured by work samples and/or tests.",
        standard: "CCSS.Math.Content.6.NS.B.3"
      }
    ]
  },
  {
    seisId: "2286103",
    firstName: "Liliana",
    lastName: "Roberts",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "25/26 RSP #3",
        baseline: "Matteo is able to solve real-world and mathematical problems involving the four operations (e.g., multiplication, division, subtraction, or addition) with about 25% accuracy. Successful trail were mostly in addition and included lots of guiding questions, models and prompting.",
        goal: "By 4/30/2026, given supports (e.g., visuals, multiplication chart or manipulatives as needed), Matteo will solve real-world and mathematical problems involving the four operations (e.g., multiplication, division, subtraction, or addition) with at least 80% accuracy in 3 out of 4 trials as measured by student work samples/teacher records.",
        standard: "7.NS.3"
      }
    ]
  },
  {
    seisId: "2727050",
    firstName: "Matteo",
    lastName: "Silva",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "25/26 RSP #2",
        baseline: "Matteo is able to solve real-world and mathematical problems involving the four operations (e.g., multiplication, division, subtraction, or addition) with about 25% accuracy. Successful trail were mostly in addition and included lots of guiding questions, models and prompting.",
        goal: "By 4/30/2026, given supports (e.g., visuals, multiplication chart or manipulatives as needed), Matteo will solve real-world and mathematical problems involving the four operations (e.g., multiplication, division, subtraction, or addition) with at least 80% accuracy in 3 out of 4 trials as measured by student work samples/teacher records.",
        standard: "7.NS.3"
      }
    ]
  },
  {
    seisId: "1977144",
    firstName: "Mikah",
    lastName: "Villagomez",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [
      {
        areaOfNeed: "Math",
        goalNumber: "Proposed Draft SAI #1 - 24/25",
        baseline: "Mikah is currently able to add, subtract, and multiply multi-digit (by 1 digit) numbers with 80% accuracy. Decimals are a new concept, baseline is 0%.",
        goal: "By 9/16/25, given an equation involving a multi-digit decimal and a one- or two-digit whole number (e.g., 6.72 - 2, 20.66 x 10) and a worked example of each operation, Mikah will write the solution by multiplying, dividing, subtracting, or adding using a fluent computation strategy, with 80% accuracy on 4 out of 5 trials as measured by student work samples and progress monitoring assessments",
        standard: "6.NS.3 Compute fluently with multi-digit numbers and find common factors and multiples"
      },
      {
        areaOfNeed: "Math",
        goalNumber: "Proposed Draft SAI #2 - 24/25",
        baseline: "Mikah has begun to add and subtract fractions with like denominators. Dividing Fractions are a new concept. Baseline is 0%",
        goal: "By9/16/25, given a word problem that involves division of fractions, where the divisor is a unit fraction (e.g., 3/8 ÷ 1/4), a visual model of each fraction, and a worked example, Mikah will calculate the quotient by determining how many unit fractions are needed to make the non-unit fraction, with 80% accuracy on 4 out of 5 trials as measured by student work samples and progress monitoring assessments",
        standard: "6.NS.1 Apply and extend previous understandings of multiplication and division to divide fractions by fractions"
      }
    ]
  },
  {
    seisId: "2539553",
    firstName: "Olivia",
    lastName: "Williams",
    grade: "07",
    caseManager: "Ryan Davis",
    goals: [] // No math goals found for this student
  }
];

// Summary of students and their math goals
export const STUDENT_GOAL_SUMMARY = {
  totalStudents: FILTERED_STUDENTS.length,
  studentsWithMathGoals: FILTERED_STUDENTS.filter(s => s.goals.length > 0).length,
  totalMathGoals: FILTERED_STUDENTS.reduce((sum, student) => sum + student.goals.length, 0),
  caseManagers: [...new Set(FILTERED_STUDENTS.map(s => s.caseManager))],
  standardsCovered: [...new Set(FILTERED_STUDENTS.flatMap(s => s.goals.map(g => g.standard)))],
  goalTypes: [...new Set(FILTERED_STUDENTS.flatMap(s => s.goals.map(g => g.areaOfNeed)))]
};

// Students by case manager
export const STUDENTS_BY_CASE_MANAGER = {
  'Ryan Davis': FILTERED_STUDENTS.filter(s => s.caseManager === 'Ryan Davis'),
  'Tony Delgado': FILTERED_STUDENTS.filter(s => s.caseManager === 'Tony Delgado'),
  'Jonathan Davis': FILTERED_STUDENTS.filter(s => s.caseManager === 'Jonathan Davis')
};
