# Question Template Analysis Prompt

Use this prompt with GPT-4 Turbo, Claude 3 Sonnet/Opus, or GPT-3.5 Turbo to analyze the question templates.

## Instructions for AI Model

You are an expert educational assessment designer and data analyst. Your task is to analyze a collection of question templates for an IEP (Individualized Education Program) assessment system.

## Your Analysis Should Include:

### 1. **Template Structure Analysis**
- Are all templates properly structured with required fields?
- Are variable generators correctly defined?
- Are there any missing or inconsistent fields?
- Are variable dependencies properly handled (e.g., calculated fields reference existing variables)?

### 2. **Coverage Analysis**
- What goal topics/types are covered?
- What goal topics/types are MISSING?
- Are there gaps in subject areas (Math, ELA, Other)?
- Are there gaps in question types (multiple-choice, short-answer, essay, etc.)?

### 3. **Variable Generator Quality**
- Are variable generators realistic and appropriate for the grade levels?
- Are calculated formulas correct?
- Are random ranges appropriate (not too easy, not too hard)?
- Are AI-generated variables properly prompted?

### 4. **Educational Appropriateness**
- Are question templates age-appropriate?
- Do they align with common IEP goal patterns?
- Are difficulty levels appropriate?
- Do examples match the templates?

### 5. **Template Completeness**
- Do all templates have examples?
- Are answer templates complete?
- Are explanation templates helpful?
- Are scenarios (for word problems) varied enough?

### 6. **Potential Issues**
- Identify any logical errors
- Identify any missing edge cases
- Identify any potential generation failures
- Identify any unclear or ambiguous templates

### 7. **Recommendations**
- Suggest missing templates that should be added
- Suggest improvements to existing templates
- Suggest better variable generators
- Suggest additional scenarios for word problems

## Output Format

Please provide your analysis in the following structured format:

```markdown
# Question Template Analysis Report

## Executive Summary
[2-3 sentence overview of findings]

## 1. Template Structure Analysis
### Strengths
- [List strengths]

### Issues Found
- [List issues with specific template names and line numbers if possible]

### Recommendations
- [List recommendations]

## 2. Coverage Analysis
### Topics Covered
- Math: [list topics]
- ELA: [list topics]
- Other: [list topics]

### Missing Topics (Critical)
- [List critical missing topics]

### Missing Topics (Recommended)
- [List recommended additions]

## 3. Variable Generator Quality
### Well-Designed Generators
- [List examples]

### Issues Found
- [List issues]

### Recommendations
- [List recommendations]

## 4. Educational Appropriateness
### Grade Level Appropriateness
- [Analysis]

### Alignment with IEP Goals
- [Analysis]

## 5. Template Completeness
### Complete Templates
- [List]

### Incomplete Templates
- [List with what's missing]

## 6. Critical Issues
1. [Issue 1]
2. [Issue 2]
...

## 7. Recommendations Priority List
### High Priority
1. [Recommendation 1]
2. [Recommendation 2]

### Medium Priority
1. [Recommendation 1]
2. [Recommendation 2]

### Low Priority
1. [Recommendation 1]
2. [Recommendation 2]

## 8. Suggested New Templates
[For each suggested template, provide:]
- Name
- Subject/Topic
- Question Type
- Brief description
- Why it's needed
```

## Context: IEP Assessment System

This system helps teachers create assessments from IEP goals. Goals are written at IEP meetings (e.g., "By 05/18/2026, given a two-step equation, EJ will solve it with 80% accuracy"). The system then:

1. Detects the goal topic (e.g., "two-step equation")
2. Finds matching question templates
3. Generates questions using the templates
4. Creates assessments for students

## Important Considerations

- Templates must work for students with learning disabilities
- Questions should be clear and unambiguous
- Variable generators should produce realistic, solvable problems
- Math problems should have correct answers
- ELA questions should be age-appropriate
- Templates should cover common IEP goal patterns

---

## Template Data to Analyze

[Paste the entire question_templates_for_review.json content here]
