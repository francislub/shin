import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Helper function to analyze student performance data
export async function analyzePerformanceData(data: any) {
  const prompt = `
    Analyze the following student performance data and provide insights:
    ${JSON.stringify(data, null, 2)}
    
    Please provide:
    1. Key performance trends
    2. Areas of improvement
    3. Strengths to build upon
    4. Actionable recommendations for teachers
  `

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.7,
    maxTokens: 1000,
  })

  return text
}

// Helper function to predict student performance
export async function predictStudentPerformance(studentData: any) {
  const prompt = `
    Based on the following student data, predict their future academic performance:
    ${JSON.stringify(studentData, null, 2)}
    
    Please provide:
    1. Predicted grade point average
    2. Subjects likely to improve
    3. Subjects that may need attention
    4. Recommended interventions
    5. Confidence level of prediction (low, medium, high)
  `

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.3,
    maxTokens: 800,
  })

  return text
}

// Helper function to analyze attendance patterns
export async function analyzeAttendancePatterns(attendanceData: any) {
  const prompt = `
    Analyze the following student attendance data and identify patterns:
    ${JSON.stringify(attendanceData, null, 2)}
    
    Please provide:
    1. Attendance trends
    2. Potential risk factors
    3. Students who may need intervention
    4. Recommended actions for improving attendance
  `

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.4,
    maxTokens: 800,
  })

  return text
}

// Helper function to generate message templates
export async function generateMessageTemplate(context: string, messageType: string) {
  const prompt = `
    Generate a professional ${messageType} message for a school communication based on this context:
    ${context}
    
    The message should be:
    1. Professional and clear
    2. Empathetic and supportive
    3. Action-oriented
    4. Appropriate for school communication
    
    Please provide the complete message text only.
  `

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.7,
    maxTokens: 500,
  })

  return text
}

// Helper function to summarize academic data
export async function summarizeAcademicData(data: any) {
  const prompt = `
    Summarize the following academic data in a concise, insightful way:
    ${JSON.stringify(data, null, 2)}
    
    Focus on:
    1. Key performance indicators
    2. Notable trends
    3. Outliers or exceptions
    4. Actionable insights
  `

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt,
    temperature: 0.5,
    maxTokens: 600,
  })

  return text
}
