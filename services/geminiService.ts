

import { GoogleGenAI, Type, Content } from "@google/genai";
import type { AnalysisResult, EcosystemAnalysis, AncestralEcho, HopeSpotlight } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    isAnimalOrPlant: {
      type: Type.BOOLEAN,
      description: "Is the primary subject an animal or plant? If not, set to false."
    },
    subjectName: {
      type: Type.STRING,
      description: "Common name of the identified subject."
    },
    description: {
      type: Type.STRING,
      description: "A captivating, detailed narrative about the subject, written as if you are an expert field biologist. Include interesting facts about its behavior, role in the ecosystem, and unique characteristics."
    },
    conservationStatus: {
        type: Type.STRING,
        enum: ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE'],
        description: "The official IUCN conservation status code. Use 'NE' (Not Evaluated) for non-wildlife subjects."
    },
    populationTrend: {
        type: Type.STRING,
        enum: ['Increasing', 'Decreasing', 'Stable', 'Unknown'],
        description: "The current population trend of the species."
    },
    primaryThreats: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 2-3 primary threats to this species (e.g., 'Habitat Loss', 'Climate Change')."
    },
    estimatedLocation: {
        type: Type.STRING,
        description: "A plausible real-world location based on the environment in the media (e.g., 'Serengeti National Park, Tanzania')."
    },
    ecosystem: {
        type: Type.STRING,
        description: "The general ecosystem type (e.g., 'Amazon Rainforest', 'Arctic Tundra')."
    },
    coordinates: {
        type: Type.OBJECT,
        properties: {
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER }
        },
        description: "Estimated latitude and longitude for the location."
    },
    suggestedMissions: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['plasticPatrol', 'pollinatorPledge', 'artForAwareness', 'general']},
                emoji: { type: Type.STRING },
                xp: { type: Type.INTEGER, description: "XP reward, typically between 20 and 50." }
            },
            required: ["title", "description", "type", "emoji", "xp"]
        },
        description: "An array of 2-3 actionable, kid-friendly 'Field Missions' related to the animal or its habitat. If it's a marine animal, suggest a 'plasticPatrol' mission. If a bee/butterfly, a 'pollinatorPledge'. If critically endangered, an 'artForAwareness' mission."
    }
  },
  required: ["isAnimalOrPlant", "subjectName", "description", "conservationStatus", "populationTrend", "primaryThreats", "estimatedLocation", "ecosystem", "coordinates", "suggestedMissions"]
};

export const analyzeMedia = async (file: File): Promise<AnalysisResult> => {
  const systemInstruction = `You are 'Gem,' an AI Field Biologist for "Echo Location," a conservation app. Your role is to analyze user-submitted media and return a detailed "Sighting Report."
- First, determine if the media contains an animal or plant.
- If it IS wildlife, provide a rich narrative, its conservation data, a simulated location based on the environment, and suggest 2-3 actionable, kid-friendly "Field Missions" to help conservation.
- If it is NOT wildlife (e.g., a car, a toy), set isAnimalOrPlant to false. For the subjectName, identify the object. For the description, write a friendly message explaining that while you can see it's a [subjectName], you are designed to identify wildlife for conservation field missions. Fill conservation data with 'NE' or 'Unknown' and provide no missions.
- Respond ONLY with a valid JSON object conforming to the schema.`;
  
  const mediaPart = await fileToGenerativePart(file);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [mediaPart] },
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: analysisSchema,
    }
  });

  try {
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("The AI field biologist gave an unexpected response. Please try another file.");
  }
};

export const getHopeSpotlight = async (animalName: string): Promise<HopeSpotlight> => {
    const systemInstruction = `You are 'Gem,' an optimistic AI conservationist. The user has just learned about an endangered animal. To inspire hope, tell a concise, uplifting, true story about a real-world conservation success for a species. It can be about the provided animal or a similar one. The story should be 3-4 sentences and highlight how human efforts led to a positive outcome (e.g., comeback of the Humpback Whale, Black-footed Ferret, etc.). Do not use JSON.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Tell me a hope-filled conservation success story related to an animal like the ${animalName}.`,
        config: { systemInstruction }
    });

    return { subjectName: animalName, story: response.text };
};

export const getConservationNews = async (): Promise<string[]> => {
    const systemInstruction = `You are an AI conservation news editor for the "Echo Location" app. Your audience is young explorers and their families. Your task is to find and summarize 3 recent, POSITIVE conservation news stories from around the world. Use your search tool. For each story, provide a single-sentence, kid-friendly summary, starting with an emoji for the country.
    Example: "🇰🇪 Good News from Kenya! Ranger teams report a 10% increase in the Black Rhino population at Ol Pejeta Conservancy this year!"
    Return ONLY a JSON array of these 3 strings.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Find three recent positive conservation news stories.",
        config: {
            systemInstruction,
            tools: [{googleSearch: {}}],
        },
    });

    try {
        const jsonText = response.text.trim();
        // The model might return a markdown code block, so let's strip it.
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');
        return JSON.parse(cleanedJsonText);
    } catch (e) {
        console.error("Error parsing conservation news:", response.text, e);
        return ["Could not fetch the latest good news, but conservationists are working hard everywhere!"];
    }
};


// --- OTHER FUNCTIONS (can be kept or removed if not used in the new flow) ---


export const analyzeEcosystem = async (file: File): Promise<EcosystemAnalysis> => {
  const systemInstruction = `You are 'Gem,' an enthusiastic and knowledgeable AI ecologist. The user has already identified the main subject in the provided media. Your task is to analyze the entire scene to identify other significant elements of the ecosystem in the background and surroundings.
- Identify 2-4 additional subjects (plants, other animals, terrain features, etc.).
- For each subject, provide its common name, a brief and interesting description, and a relevant emoji.
- Provide a concise overall summary of the ecosystem depicted.
- If no other subjects can be clearly identified, state that and provide a summary of what you can see.
Respond ONLY with a valid JSON object that conforms to the provided schema.`;

  const mediaPart = await fileToGenerativePart(file);

  const ecosystemSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "A concise summary of the overall ecosystem depicted in the media."
      },
      subjects: {
        type: Type.ARRAY,
        description: "An array of 2-4 identified subjects in the ecosystem's background or surroundings.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Common name of the identified subject." },
            description: { type: Type.STRING, description: "A brief, interesting description of the subject." },
            emoji: { type: Type.STRING, description: "A single emoji relevant to the subject." }
          },
          required: ["name", "description", "emoji"]
        }
      }
    },
    required: ["summary", "subjects"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [mediaPart] },
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: ecosystemSchema,
    }
  });
  
  try {
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as EcosystemAnalysis;
  } catch (error) {
    console.error("Failed to parse Gemini ecosystem response:", response.text);
    throw new Error("The AI guide gave an unexpected response for the ecosystem analysis.");
  }
};


export const getAnimalPalCheckIn = async (palName: string): Promise<string> => {
  const systemInstruction = `You are 'Gem,' an AI Field Biologist and friendly companion for a young Eco-Scout. Provide a warm, personalized 'check-in' message about one of their animal friends. The message should be cheerful, short, and imaginative.
Example for a Giraffe: "Welcome back, Eco-Scout! Good news from the savanna today. Your friend, the Giraffe, was spotted near a tall acacia tree, enjoying a leafy breakfast!"
Keep the response to 2-3 sentences. Do not use JSON. Write naturally.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a check-in message for my animal friend, a ${palName}.`,
    config: {
      systemInstruction
    }
  });

  return response.text;
};

export const getAnimalChatResponse = async (
  animalName: string,
  animalDescription: string,
  history: Content[],
  newMessage: string
): Promise<string> => {
  const systemInstruction = `You are ${animalName}, a friendly animal talking to a young child explorer. Your personality is based on this description: "${animalDescription}". Keep your replies short, fun, in character, and easy for a child to understand. Speak from the first-person perspective as the animal. Never break character. Do not use emojis.`;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
    history,
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};
