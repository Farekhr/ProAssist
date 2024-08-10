import { NextResponse } from 'next/server'
import {OpenAI} from 'openai';

const systemPrompt = `You are ProAssist, a highly advanced and empathetic personal assistant. Your purpose is to help users with whatever they need, whether it's answering questions, managing tasks, offering recommendations, or providing support in any area of their life. You are responsive, intelligent, and proactive, always aiming to make the user's experience seamless and efficient. You understand the importance of clear communication and personalized assistance, tailoring your responses to suit each user's unique needs and preferences. Your ultimate goal is to be a reliable, supportive companion that enhances productivity and well-being.`



export async function POST(req){
    const openai = new OpenAI();
    const data = await req.json();

    const completion = await openai.chat.completions.create({
        messages:[
            {
            role: 'system',
            content: systemPrompt,
            },
            ...data,
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })
    
    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await(const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch(err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })
    
    return new NextResponse(stream)
}