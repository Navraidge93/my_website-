const axios = require('axios');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class AIService {
  static async generatePlanningsuggestion(userContext) {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const { goals, constraints, energyLevel, history } = userContext;

      const prompt = `You are a productivity AI assistant. Generate a personalized daily planning based on the following user context:

Goals: ${goals || 'General productivity'}
Time Constraints: ${constraints || 'Full day available'}
Energy Level Preference: ${energyLevel || 'Moderate'}
${history ? `Previous Performance: ${history}` : ''}

Generate a structured daily schedule with:
- Tasks with time slots (HH:MM format)
- Task categories (school, business, health, perso, pause)
- Icons (from lucide icon set: book-open, briefcase, dumbbell, coffee, moon, sun, etc.)
- Duration estimates
- Motivational notes

Return a JSON array of tasks in this exact format:
[
  {
    "time": "08:00",
    "title": "Task description",
    "category": "school/business/health/perso/pause",
    "icon": "icon-name",
    "notes": "Helpful note or motivation",
    "duration_estimate": 60
  }
]

Keep it realistic, balanced, and motivating. Include breaks and variety.`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional productivity coach and planning assistant. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Try to parse JSON from the response
      let tasks;
      try {
        // Remove markdown code blocks if present
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0]);
        } else {
          tasks = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Failed to parse AI response');
      }

      return tasks;
    } catch (error) {
      console.error('AI service error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getMotivationalMessage(userStats) {
    try {
      if (!OPENAI_API_KEY) {
        return 'Keep going! You\'re doing great!';
      }

      const { completionRate, streak, totalTasks } = userStats;

      const prompt = `Generate a short, motivational message (max 2 sentences) for a user with these stats:
- Completion rate: ${completionRate}%
- Current streak: ${streak} days
- Total tasks completed: ${totalTasks}

Be encouraging, specific, and energetic.`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an enthusiastic productivity coach.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI motivational message error:', error);
      return 'Keep pushing forward! Every task completed is progress!';
    }
  }

  static async analyzePlanningEffectiveness(tasks) {
    try {
      if (!OPENAI_API_KEY) {
        return { score: 70, suggestions: ['Consider adding more breaks', 'Balance work and rest'] };
      }

      const completedTasks = tasks.filter(t => t.completed);
      const completionRate = (completedTasks.length / tasks.length * 100).toFixed(1);

      const prompt = `Analyze this planning effectiveness:
Total tasks: ${tasks.length}
Completed: ${completedTasks.length}
Completion rate: ${completionRate}%

Categories breakdown:
${Object.entries(
  tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {})
).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}

Provide:
1. An effectiveness score (0-100)
2. 3 specific, actionable suggestions to improve

Return JSON:
{
  "score": 75,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a productivity analysis expert. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { score: 70, suggestions: ['Keep up the good work!'] };
    } catch (error) {
      console.error('AI analysis error:', error);
      return { score: 70, suggestions: ['Unable to analyze at this time'] };
    }
  }
}

module.exports = AIService;
