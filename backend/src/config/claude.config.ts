import { appConfig } from './app.config';

export const claudeConfig = {
  apiKey: appConfig.claude.apiKey,
  model: appConfig.claude.model,
  maxTokens: appConfig.claude.maxTokens,
  temperature: appConfig.claude.temperature,

  // Prompt templates for different analysis types
  prompts: {
    failureAnalysis: `You are an expert QA engineer analyzing a test failure. Your task is to categorize the failure and provide actionable insights.

Test Information:
- Test Name: {{testName}}
- Platform: {{platform}}
- Error Message: {{errorMessage}}

Stack Trace:
{{stackTrace}}

{{#if locatorUsed}}
Locator Used: {{locatorUsed}}
{{/if}}

Screenshot is attached showing the state when the failure occurred.

Please analyze this failure and categorize it into ONE of the following categories:

1. ACTUAL_BUG - A genuine application defect or regression
2. FLAKY_LOCATOR - Element locator changed (ID, class, xpath changed in UI)
3. TIMING_ISSUE - Race condition, synchronization, or timeout problem
4. ENVIRONMENTAL_ISSUE - Infrastructure, network, or setup problem

Provide your response in the following JSON format:
{
  "category": "ACTUAL_BUG | FLAKY_LOCATOR | TIMING_ISSUE | ENVIRONMENTAL_ISSUE",
  "confidence": <number 0-100>,
  "reasoning": "<detailed explanation>",
  "evidencePoints": [
    "<specific evidence 1>",
    "<specific evidence 2>",
    "<specific evidence 3>"
  ],
  "suggestedActions": [
    "<action 1>",
    "<action 2>"
  ],
  "rootCause": "<likely root cause if identifiable>"
}

Be specific and provide confidence based on available evidence. Higher confidence (80-100) for clear indicators, lower (30-60) for ambiguous cases.`,

    locatorSuggestion: `You are an expert in mobile test automation. A test failed because an element locator no longer works.

Failed Locator:
- Type: {{locatorType}}
- Value: {{locatorValue}}

Error: {{error}}

Page Context: {{pageContext}}

Screenshot is attached showing the current state of the UI.

Please analyze the screenshot and suggest a better, more stable locator for this element.

Provide your response in JSON format:
{
  "suggestedLocators": [
    {
      "type": "id | xpath | accessibilityId | class | androidUIAutomator | iOSNsPredicate",
      "value": "<locator value>",
      "confidence": <number 0-100>,
      "reasoning": "<why this locator is better>"
    }
  ],
  "elementDescription": "<what element you identified in the screenshot>",
  "additionalNotes": "<any other observations>"
}

Prioritize stability and uniqueness. Prefer:
1. Accessibility IDs
2. Resource IDs
3. Unique text
4. Relative XPath (short and stable)

Avoid fragile locators like absolute XPath or index-based selectors.`,

    elementAnalysis: `Analyze this mobile app screenshot and identify UI elements.

Focus Area: {{focusArea}}

Please identify all interactive elements (buttons, inputs, text fields, etc.) in the screenshot and provide their characteristics.

Response format (JSON):
{
  "elements": [
    {
      "type": "button | input | text | image | etc",
      "text": "<visible text if any>",
      "position": "<description of position>",
      "suggestedLocators": [
        {
          "type": "locator type",
          "value": "locator value",
          "confidence": <0-100>
        }
      ]
    }
  ]
}`
  }
};

// Helper to replace template variables
export const fillTemplate = (template: string, variables: Record<string, any>): string => {
  let result = template;

  // Replace simple variables {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }

  // Handle conditional blocks {{#if variable}}...{{/if}}
  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
    return variables[key] ? content : '';
  });

  return result;
};
