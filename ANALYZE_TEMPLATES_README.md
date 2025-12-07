# Question Template Analysis Guide

This guide helps you analyze the question templates using AI models.

## Files Included

1. **`analyze_question_templates_prompt.md`** - The analysis prompt (use this with any AI)
2. **`analyze_templates_script.js`** - Automated script for OpenAI GPT-4 Turbo
3. **`analyze_templates_claude.js`** - Automated script for Anthropic Claude 3 Sonnet

## Quick Start Options

### Option 1: Use the Scripts (Easiest)

#### For OpenAI GPT-4 Turbo:
```bash
export OPENAI_API_KEY="your-openai-api-key"
node analyze_templates_script.js
```

#### For Claude 3 Sonnet:
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
node analyze_templates_claude.js
```

The script will:
- Load your templates
- Send them to the AI model
- Save the analysis to `template_analysis_report.md`

### Option 2: Manual Copy-Paste (No Scripts Needed)

1. Open `analyze_question_templates_prompt.md`
2. Copy the entire prompt
3. Open ChatGPT (GPT-4), Claude, or another AI
4. Paste the prompt
5. At the bottom, paste your `question_templates_for_review.json` content
6. Get the analysis

### Option 3: Use Cursor/VS Code AI

1. Open `question_templates_for_review.json` in your editor
2. Open the AI chat (Cmd+L in Cursor)
3. Copy the prompt from `analyze_question_templates_prompt.md`
4. Paste it and ask to analyze the open file

## Recommended Models (Best to Good)

1. **GPT-4 Turbo** (`gpt-4-turbo-preview` or `gpt-4o`)
   - Best for structured analysis
   - Excellent at pattern recognition
   - Cost: ~$0.01-0.03 per analysis

2. **Claude 3 Sonnet** (`claude-3-5-sonnet-20241022`)
   - Excellent analytical capabilities
   - Great at structured feedback
   - Cost: ~$0.003 per 1K tokens

3. **GPT-3.5 Turbo** (`gpt-3.5-turbo`)
   - Good for basic analysis
   - Much cheaper (~$0.002 per analysis)
   - May miss some subtle patterns

4. **Claude 3 Haiku** (`claude-3-haiku-20240307`)
   - Fast and cheap
   - Good for basic analysis
   - May be less thorough

## What the Analysis Will Cover

The AI will analyze:

1. ✅ **Template Structure** - Are fields complete and consistent?
2. ✅ **Coverage** - What topics are covered? What's missing?
3. ✅ **Variable Generators** - Are they correct and appropriate?
4. ✅ **Educational Appropriateness** - Age-appropriate? Aligned with IEP goals?
5. ✅ **Completeness** - Do templates have examples? Are they complete?
6. ✅ **Issues** - Logical errors, missing edge cases, potential failures
7. ✅ **Recommendations** - What to add, what to improve

## Expected Output

The analysis will be saved as `template_analysis_report.md` with:

- Executive Summary
- Detailed findings for each category
- Priority-ranked recommendations
- Suggested new templates

## Troubleshooting

### Script Errors

**"API key not set"**
- Make sure you've exported the environment variable
- Check: `echo $OPENAI_API_KEY` or `echo $ANTHROPIC_API_KEY`

**"Module not found"**
- Make sure you're using Node.js 18+ with ES modules
- Or convert to CommonJS if needed

**"File not found"**
- Make sure `question_templates_for_review.json` is in the same directory
- Check file permissions

### Manual Analysis Tips

- If using ChatGPT, select GPT-4 model (not GPT-3.5)
- If the response is cut off, ask "continue" or "please finish the analysis"
- For Claude, use Claude 3 Sonnet or Opus (not Haiku for best results)

## Next Steps After Analysis

1. Review the `template_analysis_report.md`
2. Fix critical issues first
3. Add missing templates
4. Improve variable generators
5. Re-run analysis to verify improvements

## Cost Estimates

- **GPT-4 Turbo**: ~$0.01-0.03 per analysis (one-time)
- **Claude 3 Sonnet**: ~$0.003-0.01 per analysis (one-time)
- **GPT-3.5 Turbo**: ~$0.002 per analysis (one-time)

These are one-time costs for analysis. The templates themselves don't cost anything to use.
