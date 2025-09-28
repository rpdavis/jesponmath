// Common Core State Standards (CCSS) Data
// Recreated based on actual standards used in the JepsonMath system
// Source: Extracted from IEP CSV data and official CCSS documentation

import type { CCSSStandard } from '@/types/standards';

// CCSS Mathematics Standards Database
const CCSS_MATH_STANDARDS: CCSSStandard[] = [
  // Grade 3 Standards
  {
    code: "3.OA.3",
    grade: "3",
    domain: "Operations & Algebraic Thinking",
    cluster: "Represent and solve problems involving multiplication and division",
    title: "Multiplication and Division Problems",
    description: "Use multiplication and division within 100 to solve word problems in situations involving equal groups, arrays, and measurement quantities.",
    category: "Number & Operations"
  },
  {
    code: "3.OA.8",
    grade: "3", 
    domain: "Operations & Algebraic Thinking",
    cluster: "Solve problems involving the four operations",
    title: "Two-Step Word Problems",
    description: "Solve two-step word problems using the four operations. Represent these problems using equations with a letter standing for the unknown quantity.",
    category: "Number & Operations"
  },

  // Grade 4 Standards
  {
    code: "4.NBT.2",
    grade: "4",
    domain: "Number & Operations in Base Ten",
    cluster: "Generalize place value understanding for multi-digit whole numbers",
    title: "Read and Write Multi-Digit Numbers",
    description: "Read and write multi-digit whole numbers using base-ten numerals, number names, and expanded form. Compare two multi-digit numbers based on meanings of the digits in each place.",
    category: "Number & Operations"
  },
  {
    code: "4.NBT.4",
    grade: "4",
    domain: "Number & Operations in Base Ten", 
    cluster: "Use place value understanding and properties of operations to perform multi-digit arithmetic",
    title: "Add and Subtract Multi-Digit Numbers",
    description: "Fluently add and subtract multi-digit whole numbers using the standard algorithm.",
    category: "Number & Operations"
  },
  {
    code: "4.NBT.5",
    grade: "4",
    domain: "Number & Operations in Base Ten",
    cluster: "Use place value understanding and properties of operations to perform multi-digit arithmetic", 
    title: "Multiply Multi-Digit Numbers",
    description: "Multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers, using strategies based on place value and the properties of operations.",
    category: "Number & Operations"
  },
  {
    code: "4.NF.1",
    grade: "4",
    domain: "Number & Operations—Fractions",
    cluster: "Extend understanding of fraction equivalence and ordering",
    title: "Equivalent Fractions",
    description: "Explain why a fraction a/b is equivalent to a fraction (n × a)/(n × b) by using visual fraction models, with attention to how the number and size of the parts differ even though the two fractions themselves are the same size.",
    category: "Number & Operations"
  },
  {
    code: "4.NF.3a",
    grade: "4",
    domain: "Number & Operations—Fractions",
    cluster: "Build fractions from unit fractions",
    title: "Add and Subtract Fractions",
    description: "Understand addition and subtraction of fractions as joining and separating parts referring to the same whole.",
    category: "Number & Operations"
  },
  {
    code: "4.OA.3",
    grade: "4",
    domain: "Operations & Algebraic Thinking",
    cluster: "Use the four operations with whole numbers to solve problems",
    title: "Multi-Step Word Problems",
    description: "Solve multistep word problems posed with whole numbers and having whole-number answers using the four operations, including problems in which remainders must be interpreted.",
    category: "Number & Operations"
  },

  // Grade 5 Standards
  {
    code: "5.NBT.5",
    grade: "5",
    domain: "Number & Operations in Base Ten",
    cluster: "Perform operations with multi-digit whole numbers and with decimals to hundredths",
    title: "Multiply Multi-Digit Numbers",
    description: "Fluently multiply multi-digit whole numbers using the standard algorithm.",
    category: "Number & Operations"
  },
  {
    code: "5.NBT.6",
    grade: "5",
    domain: "Number & Operations in Base Ten",
    cluster: "Perform operations with multi-digit whole numbers and with decimals to hundredths",
    title: "Divide Multi-Digit Numbers",
    description: "Find whole-number quotients of whole numbers with up to four-digit dividends and two-digit divisors, using strategies based on place value, the properties of operations, and/or the relationship between multiplication and division.",
    category: "Number & Operations"
  },
  {
    code: "5.NBT.7",
    grade: "5",
    domain: "Number & Operations in Base Ten",
    cluster: "Perform operations with multi-digit whole numbers and with decimals to hundredths",
    title: "Operations with Decimals",
    description: "Add, subtract, multiply, and divide decimals to hundredths, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction.",
    category: "Number & Operations"
  },
  {
    code: "5.NF.1",
    grade: "5",
    domain: "Number & Operations—Fractions",
    cluster: "Use equivalent fractions as a strategy to add and subtract fractions",
    title: "Add and Subtract Fractions",
    description: "Add and subtract fractions with unlike denominators (including mixed numbers) by replacing given fractions with equivalent fractions in such a way as to produce an equivalent sum or difference of fractions with like denominators.",
    category: "Number & Operations"
  },
  {
    code: "5.OA.2",
    grade: "5",
    domain: "Operations & Algebraic Thinking",
    cluster: "Write and interpret numerical expressions",
    title: "Numerical Expressions",
    description: "Write simple expressions that record calculations with numbers, and interpret numerical expressions without evaluating them.",
    category: "Algebra"
  },

  // Grade 6 Standards
  {
    code: "6.EE.2a",
    grade: "6",
    domain: "Expressions & Equations",
    cluster: "Apply and extend previous understandings of arithmetic to algebraic expressions",
    title: "Evaluate Expressions",
    description: "Write expressions that record operations with numbers and with letters standing for numbers.",
    category: "Algebra"
  },
  {
    code: "6.EE.6",
    grade: "6",
    domain: "Expressions & Equations",
    cluster: "Reason about and solve one-variable equations and inequalities",
    title: "Solve One-Variable Equations",
    description: "Use variables to represent numbers and write expressions when solving a real-world or mathematical problem; understand that a variable can represent an unknown number, or, depending on the purpose at hand, any number in a specified set.",
    category: "Algebra"
  },
  {
    code: "6.EE.7",
    grade: "6",
    domain: "Expressions & Equations",
    cluster: "Reason about and solve one-variable equations and inequalities",
    title: "Solve Real-World Problems",
    description: "Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q for cases in which p, q and x are all nonnegative rational numbers.",
    category: "Algebra"
  },
  {
    code: "6.G.1",
    grade: "6",
    domain: "Geometry",
    cluster: "Solve real-world and mathematical problems involving area, surface area, and volume",
    title: "Area and Volume",
    description: "Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing into rectangles or decomposing into triangles and other shapes; apply these techniques in the context of solving real-world and mathematical problems.",
    category: "Geometry"
  },
  {
    code: "6.NS.1",
    grade: "6",
    domain: "The Number System",
    cluster: "Apply and extend previous understandings of multiplication and division to divide fractions by fractions",
    title: "Divide Fractions",
    description: "Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions.",
    category: "Number & Operations"
  },
  {
    code: "6.NS.2",
    grade: "6",
    domain: "The Number System",
    cluster: "Compute fluently with multi-digit numbers and find common factors and multiples",
    title: "Multi-Digit Division",
    description: "Fluently divide multi-digit numbers using the standard algorithm.",
    category: "Number & Operations"
  },
  {
    code: "6.NS.3",
    grade: "6",
    domain: "The Number System",
    cluster: "Compute fluently with multi-digit numbers and find common factors and multiples",
    title: "Operations with Decimals",
    description: "Fluently add, subtract, multiply, and divide multi-digit decimals using the standard algorithm for each operation.",
    category: "Number & Operations"
  },
  {
    code: "6.NS.5",
    grade: "6",
    domain: "The Number System",
    cluster: "Apply and extend previous understandings of numbers to the system of rational numbers",
    title: "Rational Numbers",
    description: "Understand that positive and negative numbers are used together to describe quantities having opposite directions or values.",
    category: "Number & Operations"
  },
  {
    code: "6.NS.7",
    grade: "6",
    domain: "The Number System", 
    cluster: "Apply and extend previous understandings of numbers to the system of rational numbers",
    title: "Order Rational Numbers",
    description: "Understand ordering and absolute value of rational numbers.",
    category: "Number & Operations"
  },
  {
    code: "6.NS.7a",
    grade: "6",
    domain: "The Number System",
    cluster: "Apply and extend previous understandings of numbers to the system of rational numbers",
    title: "Opposite Numbers",
    description: "Interpret statements of inequality as statements about the relative position of two numbers on a number line diagram.",
    category: "Number & Operations"
  },
  {
    code: "6.NS.B.2",
    grade: "6",
    domain: "The Number System",
    cluster: "Compute fluently with multi-digit numbers and find common factors and multiples",
    title: "Factors and Multiples",
    description: "Fluently divide multi-digit numbers using the standard algorithm.",
    category: "Number & Operations"
  },
  {
    code: "6.RP.2",
    grade: "6",
    domain: "Ratios & Proportional Relationships",
    cluster: "Understand ratio concepts and use ratio reasoning to solve problems",
    title: "Unit Rates",
    description: "Understand the concept of a unit rate a/b associated with a ratio a:b with b ≠ 0, and use rate language in the context of a ratio relationship.",
    category: "Number & Operations"
  },

  // Grade 7 Standards
  {
    code: "7.EE.1",
    grade: "7",
    domain: "Expressions & Equations",
    cluster: "Use properties of operations to generate equivalent expressions",
    title: "Equivalent Expressions",
    description: "Apply properties of operations as strategies to add, subtract, factor, and expand linear expressions with rational coefficients.",
    category: "Algebra"
  },
  {
    code: "7.EE.4a",
    grade: "7",
    domain: "Expressions & Equations",
    cluster: "Solve real-life and mathematical problems using numerical and algebraic expressions and equations",
    title: "Linear Equations",
    description: "Solve word problems leading to equations of the form px + q = r and p(x + q) = r, where p, q, and r are specific rational numbers.",
    category: "Algebra"
  },
  {
    code: "7.EE.B.4",
    grade: "7",
    domain: "Expressions & Equations",
    cluster: "Solve real-life and mathematical problems using numerical and algebraic expressions and equations",
    title: "Generate and Solve Equations",
    description: "Use variables to represent quantities in a real-world or mathematical problem, and construct simple equations and inequalities to solve problems by reasoning about the quantities.",
    category: "Algebra"
  },
  {
    code: "7.NS.3",
    grade: "7",
    domain: "The Number System",
    cluster: "Apply and extend previous understandings of operations with fractions",
    title: "Operations with Rational Numbers",
    description: "Solve real-world and mathematical problems involving the four operations with rational numbers.",
    category: "Number & Operations"
  },
  {
    code: "7.NS.A.1",
    grade: "7",
    domain: "The Number System",
    cluster: "Apply and extend previous understandings of operations with fractions to add and subtract rational numbers",
    title: "Add and Subtract Rational Numbers",
    description: "Apply and extend previous understandings of addition and subtraction to add and subtract rational numbers; represent addition and subtraction on a horizontal or vertical number line diagram.",
    category: "Number & Operations"
  },
  {
    code: "7.NS.A.2",
    grade: "7",
    domain: "The Number System",
    cluster: "Apply and extend previous understandings of operations with fractions to add and subtract rational numbers",
    title: "Multiply and Divide Rational Numbers",
    description: "Apply and extend previous understandings of multiplication and division and of fractions to multiply and divide rational numbers.",
    category: "Number & Operations"
  }
];

// CCSS English Language Arts Standards Database
const CCSS_ELA_STANDARDS: CCSSStandard[] = [
  // Reading: Foundational Skills
  {
    code: "RF.1.3f",
    grade: "1",
    domain: "Reading: Foundational Skills",
    cluster: "Phonics and Word Recognition",
    title: "Inflectional Endings",
    description: "Know and apply grade-level phonics and word analysis skills in decoding words both in isolation and in text. Read words with inflectional endings.",
    category: "Reading"
  },
  {
    code: "RF.3.3c",
    grade: "3",
    domain: "Reading: Foundational Skills",
    cluster: "Phonics and Word Recognition",
    title: "Multi-syllable Words",
    description: "Decode multisyllable words.",
    category: "Reading"
  },
  {
    code: "RF.3.4",
    grade: "3",
    domain: "Reading: Foundational Skills",
    cluster: "Fluency",
    title: "Read with Fluency",
    description: "Read with sufficient accuracy and fluency to support comprehension.",
    category: "Reading"
  },
  {
    code: "RF.4.3a",
    grade: "4",
    domain: "Reading: Foundational Skills",
    cluster: "Phonics and Word Recognition", 
    title: "Multi-syllable Words",
    description: "Use combined knowledge of all letter-sound correspondences, syllabication patterns, and morphology to read accurately unfamiliar multisyllabic words in context and out of context.",
    category: "Reading"
  },
  {
    code: "RF.4.4b",
    grade: "4",
    domain: "Reading: Foundational Skills",
    cluster: "Fluency",
    title: "Read with Expression",
    description: "Read on-level prose and poetry orally with accuracy, appropriate rate, and expression on successive readings.",
    category: "Reading"
  },
  {
    code: "RF.5.3",
    grade: "5",
    domain: "Reading: Foundational Skills",
    cluster: "Phonics and Word Recognition",
    title: "Word Analysis Skills",
    description: "Know and apply grade-level phonics and word analysis skills in decoding words.",
    category: "Reading"
  },
  {
    code: "RF.5.4b",
    grade: "5",
    domain: "Reading: Foundational Skills",
    cluster: "Fluency",
    title: "Read with Expression",
    description: "Read on-level prose and poetry orally with accuracy, appropriate rate, and expression on successive readings.",
    category: "Reading"
  },
  {
    code: "RF.7.4",
    grade: "7",
    domain: "Reading: Foundational Skills",
    cluster: "Fluency",
    title: "Read with Fluency",
    description: "Read with sufficient accuracy and fluency to support comprehension.",
    category: "Reading"
  },

  // Reading: Informational Text
  {
    code: "RI.3.2",
    grade: "3",
    domain: "Reading: Informational Text",
    cluster: "Key Ideas and Details",
    title: "Main Idea and Key Details",
    description: "Determine the main idea of a text; recount the key details and explain how they support the main idea.",
    category: "Reading"
  },
  {
    code: "RI.6.1",
    grade: "6",
    domain: "Reading: Informational Text",
    cluster: "Key Ideas and Details",
    title: "Cite Evidence",
    description: "Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.",
    category: "Reading"
  },
  {
    code: "RI.6.2",
    grade: "6",
    domain: "Reading: Informational Text",
    cluster: "Key Ideas and Details",
    title: "Central Idea",
    description: "Determine a central idea of a text and how it is conveyed through particular details; provide a summary of the text distinct from personal opinions or judgments.",
    category: "Reading"
  },
  {
    code: "RI.7.1",
    grade: "7",
    domain: "Reading: Informational Text",
    cluster: "Key Ideas and Details",
    title: "Cite Several Pieces of Evidence",
    description: "Cite several pieces of textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.",
    category: "Reading"
  },
  {
    code: "RI.7.2",
    grade: "7",
    domain: "Reading: Informational Text",
    cluster: "Key Ideas and Details",
    title: "Central Ideas",
    description: "Determine two or more central ideas in a text and analyze their development over the course of the text; provide an objective summary of the text.",
    category: "Reading"
  },
  {
    code: "RI.7.6",
    grade: "7",
    domain: "Reading: Informational Text",
    cluster: "Craft and Structure",
    title: "Author's Point of View",
    description: "Determine an author's point of view or purpose in a text and analyze how the author distinguishes his or her position from that of others.",
    category: "Reading"
  },
  {
    code: "RI.7.10",
    grade: "7",
    domain: "Reading: Informational Text",
    cluster: "Range of Reading and Level of Text Complexity",
    title: "Read Complex Text",
    description: "By the end of the year, read and comprehend literary nonfiction in the grades 6-8 text complexity band proficiently, with scaffolding as needed at the high end of the range.",
    category: "Reading"
  },
  {
    code: "RI.8.10",
    grade: "8",
    domain: "Reading: Informational Text",
    cluster: "Range of Reading and Level of Text Complexity",
    title: "Read Complex Text",
    description: "By the end of the year, read and comprehend literary nonfiction at the high end of the grades 6-8 text complexity band independently and proficiently.",
    category: "Reading"
  },

  // Reading: Literature
  {
    code: "RL.4.1",
    grade: "4",
    domain: "Reading: Literature",
    cluster: "Key Ideas and Details",
    title: "Refer to Details",
    description: "Refer to details and examples in a text when explaining what the text says explicitly and when drawing inferences from the text.",
    category: "Reading"
  },
  {
    code: "RL.4.3",
    grade: "4",
    domain: "Reading: Literature",
    cluster: "Key Ideas and Details",
    title: "Describe Characters",
    description: "Describe in depth a character, setting, or event in a story or drama, drawing on specific details in the text (e.g., a character's thoughts, words, or actions).",
    category: "Reading"
  },
  {
    code: "RL.5.10",
    grade: "5",
    domain: "Reading: Literature",
    cluster: "Range of Reading and Level of Text Complexity",
    title: "Read Complex Literature",
    description: "By the end of the year, read and comprehend literature, including stories, dramas, and poetry, at the high end of the grades 4-5 text complexity band independently and proficiently.",
    category: "Reading"
  },
  {
    code: "RL.6.1",
    grade: "6",
    domain: "Reading: Literature",
    cluster: "Key Ideas and Details",
    title: "Cite Evidence",
    description: "Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.",
    category: "Reading"
  },
  {
    code: "RL.6.2",
    grade: "6",
    domain: "Reading: Literature",
    cluster: "Key Ideas and Details",
    title: "Theme or Central Idea",
    description: "Determine a theme or central idea of a text and how it is conveyed through particular details; provide a summary of the text distinct from personal opinions or judgments.",
    category: "Reading"
  },
  {
    code: "RL.6.3",
    grade: "6",
    domain: "Reading: Literature",
    cluster: "Key Ideas and Details",
    title: "Plot Development",
    description: "Describe how a particular story's or drama's plot unfolds in a series of episodes as well as how the characters respond or change as the plot moves toward a resolution.",
    category: "Reading"
  },
  {
    code: "RL.6.4",
    grade: "6",
    domain: "Reading: Literature",
    cluster: "Craft and Structure",
    title: "Word Meaning",
    description: "Determine the meaning of words and phrases as they are used in a text, including figurative and connotative meanings; analyze the impact of a specific word choice on meaning and tone.",
    category: "Reading"
  },
  {
    code: "RL.6.10",
    grade: "6",
    domain: "Reading: Literature",
    cluster: "Range of Reading and Level of Text Complexity",
    title: "Read Complex Literature",
    description: "By the end of the year, read and comprehend literature, including stories, dramas, and poetry, in the grades 6-8 text complexity band proficiently, with scaffolding as needed at the high end of the range.",
    category: "Reading"
  },
  {
    code: "RL.7.3",
    grade: "7",
    domain: "Reading: Literature",
    cluster: "Key Ideas and Details",
    title: "Literary Elements",
    description: "Analyze how particular elements of a story or drama interact (e.g., how setting shapes the characters or plot).",
    category: "Reading"
  },
  {
    code: "RL.7.10",
    grade: "7",
    domain: "Reading: Literature",
    cluster: "Range of Reading and Level of Text Complexity",
    title: "Read Complex Literature",
    description: "By the end of the year, read and comprehend literature, including stories, dramas, and poetry, in the grades 6-8 text complexity band proficiently, with scaffolding as needed at the high end of the range.",
    category: "Reading"
  },

  // Writing
  {
    code: "W.3.2",
    grade: "3",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Informative/Explanatory Texts",
    description: "Write informative/explanatory texts to examine a topic and convey ideas and information clearly.",
    category: "Writing"
  },
  {
    code: "W.4.2d",
    grade: "4",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Precise Language",
    description: "Use precise language and domain-specific vocabulary to inform about or explain the topic.",
    category: "Writing"
  },
  {
    code: "W.4.10",
    grade: "4",
    domain: "Writing",
    cluster: "Range of Writing",
    title: "Write Routinely",
    description: "Write routinely over extended time frames (time for research, reflection, and revision) and shorter time frames (a single sitting or a day or two) for a range of discipline-specific tasks, purposes, and audiences.",
    category: "Writing"
  },
  {
    code: "W.5.2",
    grade: "5",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Informative/Explanatory Texts",
    description: "Write informative/explanatory texts to examine a topic and convey ideas and information clearly.",
    category: "Writing"
  },
  {
    code: "W.5.5",
    grade: "5",
    domain: "Writing",
    cluster: "Production and Distribution of Writing",
    title: "Develop and Strengthen Writing",
    description: "With guidance and support from peers and adults, develop and strengthen writing as needed by planning, revising, editing, rewriting, or trying a new approach.",
    category: "Writing"
  },
  {
    code: "W.6.1",
    grade: "6",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Arguments",
    description: "Write arguments to support claims with clear reasons and relevant evidence.",
    category: "Writing"
  },
  {
    code: "W.6.1b",
    grade: "6",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Support Claims",
    description: "Support claim(s) with clear reasons and relevant evidence, using credible sources and demonstrating an understanding of the topic or text.",
    category: "Writing"
  },
  {
    code: "W.6.2",
    grade: "6",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Informative/Explanatory Texts",
    description: "Write informative/explanatory texts to examine a topic and convey ideas, concepts, and information through the selection, organization, and analysis of relevant content.",
    category: "Writing"
  },
  {
    code: "W.6.3",
    grade: "6",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Narratives",
    description: "Write narratives to develop real or imagined experiences or events using effective technique, relevant descriptive details, and well-structured event sequences.",
    category: "Writing"
  },
  {
    code: "W.6.5",
    grade: "6",
    domain: "Writing",
    cluster: "Production and Distribution of Writing",
    title: "Develop and Strengthen Writing",
    description: "With some guidance and support from peers and adults, develop and strengthen writing as needed by planning, revising, editing, rewriting, or trying a new approach.",
    category: "Writing"
  },
  {
    code: "W.7.1",
    grade: "7",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Arguments",
    description: "Write arguments to support claims with clear reasons and relevant evidence.",
    category: "Writing"
  },
  {
    code: "W.7.1a",
    grade: "7",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Introduce Claims",
    description: "Introduce claim(s), acknowledge alternate or opposing claims, and organize the reasons and evidence logically.",
    category: "Writing"
  },
  {
    code: "W.7.2",
    grade: "7",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Informative/Explanatory Texts",
    description: "Write informative/explanatory texts to examine a topic and convey ideas, concepts, and information through the selection, organization, and analysis of relevant content.",
    category: "Writing"
  },
  {
    code: "W.7.4",
    grade: "7",
    domain: "Writing",
    cluster: "Production and Distribution of Writing",
    title: "Clear and Coherent Writing",
    description: "Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience.",
    category: "Writing"
  },
  {
    code: "W.7.5",
    grade: "7",
    domain: "Writing",
    cluster: "Production and Distribution of Writing",
    title: "Develop and Strengthen Writing",
    description: "With some guidance and support from peers and adults, develop and strengthen writing as needed by planning, revising, editing, rewriting, or trying a new approach, focusing on how well purpose and audience have been addressed.",
    category: "Writing"
  },
  {
    code: "W.8.1",
    grade: "8",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Arguments with Evidence",
    description: "Write arguments to support claims with clear reasons and relevant evidence.",
    category: "Writing"
  },
  {
    code: "W.8.2c",
    grade: "8",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    title: "Transitions and Relationships",
    description: "Use appropriate and varied transitions to create cohesion and clarify the relationships among ideas and concepts.",
    category: "Writing"
  },

  // Language
  {
    code: "L.3.2e",
    grade: "3",
    domain: "Language",
    cluster: "Conventions of Standard English",
    title: "Spelling Patterns",
    description: "Use conventional spelling for high-frequency and other studied words and for adding suffixes to base words.",
    category: "Language"
  },
  {
    code: "L.5.1",
    grade: "5",
    domain: "Language",
    cluster: "Conventions of Standard English",
    title: "Grammar and Usage",
    description: "Demonstrate command of the conventions of standard English grammar and usage when writing or speaking.",
    category: "Language"
  },
  {
    code: "L.5.2",
    grade: "5",
    domain: "Language",
    cluster: "Conventions of Standard English",
    title: "Capitalization and Punctuation",
    description: "Demonstrate command of the conventions of standard English capitalization, punctuation, and spelling when writing.",
    category: "Language"
  },
  {
    code: "L.5.4",
    grade: "5",
    domain: "Language",
    cluster: "Vocabulary Acquisition and Use",
    title: "Determine Word Meanings",
    description: "Determine or clarify the meaning of unknown and multiple-meaning words and phrases based on grade 5 reading and content, choosing flexibly from a range of strategies.",
    category: "Language"
  },
  {
    code: "L.6.1",
    grade: "6",
    domain: "Language",
    cluster: "Conventions of Standard English",
    title: "Grammar and Usage",
    description: "Demonstrate command of the conventions of standard English grammar and usage when writing or speaking.",
    category: "Language"
  },
  {
    code: "L.6.4b",
    grade: "6",
    domain: "Language",
    cluster: "Vocabulary Acquisition and Use",
    title: "Context Clues",
    description: "Use common, grade-appropriate Greek or Latin affixes and roots as clues to the meaning of a word.",
    category: "Language"
  },
  {
    code: "L.7.1",
    grade: "7",
    domain: "Language",
    cluster: "Conventions of Standard English",
    title: "Grammar and Usage",
    description: "Demonstrate command of the conventions of standard English grammar and usage when writing or speaking.",
    category: "Language"
  },
  {
    code: "L.7.2",
    grade: "7",
    domain: "Language",
    cluster: "Conventions of Standard English",
    title: "Capitalization and Punctuation",
    description: "Demonstrate command of the conventions of standard English capitalization, punctuation, and spelling when writing.",
    category: "Language"
  },
  {
    code: "L.7.4",
    grade: "7",
    domain: "Language",
    cluster: "Vocabulary Acquisition and Use",
    title: "Determine Word Meanings",
    description: "Determine or clarify the meaning of unknown and multiple-meaning words and phrases based on grade 7 reading and content, choosing flexibly from a range of strategies.",
    category: "Language"
  },
  {
    code: "L.7.5",
    grade: "7",
    domain: "Language",
    cluster: "Vocabulary Acquisition and Use",
    title: "Figurative Language",
    description: "Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.",
    category: "Language"
  },

  // Speaking & Listening
  {
    code: "SL.5.1",
    grade: "5",
    domain: "Speaking & Listening",
    cluster: "Comprehension and Collaboration",
    title: "Collaborative Discussions",
    description: "Engage effectively in a range of collaborative discussions (one-on-one, in groups, and teacher-led) with diverse partners on grade 5 topics and texts, building on others' ideas and expressing their own clearly.",
    category: "Speaking & Listening"
  },
  {
    code: "SL.6.1",
    grade: "6",
    domain: "Speaking & Listening",
    cluster: "Comprehension and Collaboration",
    title: "Collaborative Discussions",
    description: "Engage effectively in a range of collaborative discussions (one-on-one, in groups, and teacher-led) with diverse partners on grade 6 topics, texts, and issues, building on others' ideas and expressing their own clearly.",
    category: "Speaking & Listening"
  },
  {
    code: "SL.6.4",
    grade: "6",
    domain: "Speaking & Listening",
    cluster: "Presentation of Knowledge and Ideas",
    title: "Present Claims",
    description: "Present claims and findings, sequencing ideas logically and using pertinent descriptions, facts, and details to accentuate main ideas or themes; use appropriate eye contact, adequate volume, and clear pronunciation.",
    category: "Speaking & Listening"
  },
  {
    code: "SL.7.1",
    grade: "7",
    domain: "Speaking & Listening",
    cluster: "Comprehension and Collaboration",
    title: "Collaborative Discussions",
    description: "Engage effectively in a range of collaborative discussions (one-on-one, in groups, and teacher-led) with diverse partners on grade 7 topics, texts, and issues, building on others' ideas and expressing their own clearly.",
    category: "Speaking & Listening"
  },
  {
    code: "SL.7.4",
    grade: "7",
    domain: "Speaking & Listening",
    cluster: "Presentation of Knowledge and Ideas",
    title: "Present Claims",
    description: "Present claims and findings, emphasizing salient points in a focused, coherent manner with pertinent descriptions, facts, details, and examples; use appropriate eye contact, adequate volume, and clear pronunciation.",
    category: "Speaking & Listening"
  },
  {
    code: "SL.7.6",
    grade: "7",
    domain: "Speaking & Listening",
    cluster: "Presentation of Knowledge and Ideas",
    title: "Adapt Speech",
    description: "Adapt speech to a variety of contexts and tasks, demonstrating command of formal English when indicated or appropriate.",
    category: "Speaking & Listening"
  }
];

// Combine all CCSS standards
const ALL_CCSS_STANDARDS = [...CCSS_MATH_STANDARDS, ...CCSS_ELA_STANDARDS];

/**
 * Get CCSS standards by grade level
 */
export const getCCSSByGrade = (grade: string): CCSSStandard[] => {
  console.log('📚 Loading CCSS standards for grade:', grade);
  return ALL_CCSS_STANDARDS.filter(standard => standard.grade === grade);
};

/**
 * Search CCSS standards by term and optional grade filter
 */
export const searchCCSS = (searchTerm: string, grade?: string): CCSSStandard[] => {
  console.log('🔍 Searching CCSS standards:', searchTerm, grade ? `(Grade ${grade})` : '(All grades)');
  
  const searchLower = searchTerm.toLowerCase();
  let results = ALL_CCSS_STANDARDS.filter(standard => 
    standard.code.toLowerCase().includes(searchLower) ||
    standard.title.toLowerCase().includes(searchLower) ||
    standard.description.toLowerCase().includes(searchLower) ||
    standard.domain.toLowerCase().includes(searchLower) ||
    standard.cluster.toLowerCase().includes(searchLower)
  );

  if (grade) {
    results = results.filter(standard => standard.grade === grade);
  }

  console.log(`✅ Found ${results.length} CCSS standards matching "${searchTerm}"`);
  return results;
};

/**
 * Get CCSS standards by domain
 */
export const getCCSSByDomain = (domain: string): CCSSStandard[] => {
  return ALL_CCSS_STANDARDS.filter(standard => 
    standard.domain.toLowerCase().includes(domain.toLowerCase())
  );
};

/**
 * Get CCSS standards by category
 */
export const getCCSSByCategory = (category: string): CCSSStandard[] => {
  return ALL_CCSS_STANDARDS.filter(standard => 
    standard.category.toLowerCase().includes(category.toLowerCase())
  );
};

/**
 * Get a specific CCSS standard by code
 */
export const getCCSSByCode = (code: string): CCSSStandard | undefined => {
  return ALL_CCSS_STANDARDS.find(standard => 
    standard.code.toLowerCase() === code.toLowerCase()
  );
};

/**
 * Get all available grade levels
 */
export const getCCSSGradeLevels = (): string[] => {
  const grades = new Set(ALL_CCSS_STANDARDS.map(s => s.grade));
  return Array.from(grades).sort();
};

/**
 * Get all available domains
 */
export const getCCSSDomains = (): string[] => {
  const domains = new Set(ALL_CCSS_STANDARDS.map(s => s.domain));
  return Array.from(domains).sort();
};

/**
 * Get all available categories
 */
export const getCCSSCategories = (): string[] => {
  const categories = new Set(ALL_CCSS_STANDARDS.map(s => s.category));
  return Array.from(categories).sort();
};

export default ALL_CCSS_STANDARDS;