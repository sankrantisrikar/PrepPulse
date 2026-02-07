// External service integrations: OpenRouter, ElevenLabs, D-ID, Whisper, S3

import axios from 'axios';
import FormData from 'form-data';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// OpenRouter LLM Service
export async function callOpenRouter(prompt, systemPrompt, temperature = 0.7) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        },
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If array expected
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    return { raw: content };
  } catch (error) {
    console.error('OpenRouter error:', error.response?.data || error.message);
    throw new Error('Failed to generate response from LLM');
  }
}

// ElevenLabs Text-to-Speech
export async function generateSpeech(text) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error('ElevenLabs error:', error.response?.data || error.message);
    throw new Error('Failed to generate speech');
  }
}

// D-ID Avatar Video Generation
export async function generateAvatarVideo(text, audioUrl = null) {
  try {
    const payload = {
      script: audioUrl
        ? {
            type: 'audio',
            audio_url: audioUrl,
          }
        : {
            type: 'text',
            input: text,
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural',
            },
          },
      config: {
        fluent: true,
        pad_audio: 0,
      },
      source_url: `https://create-images-results.d-id.com/default-presenter-image.jpg`,
    };

    // Create talk
    const createResponse = await axios.post(
      'https://api.d-id.com/talks',
      payload,
      {
        headers: {
          'Authorization': `Basic ${process.env.DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const talkId = createResponse.data.id;
    
    // Poll for completion (max 60 seconds)
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `https://api.d-id.com/talks/${talkId}`,
        {
          headers: {
            'Authorization': `Basic ${process.env.DID_API_KEY}`,
          },
        }
      );

      if (statusResponse.data.status === 'done') {
        return {
          videoUrl: statusResponse.data.result_url,
          duration: statusResponse.data.duration,
        };
      }

      if (statusResponse.data.status === 'error') {
        throw new Error('D-ID video generation failed');
      }
    }

    throw new Error('D-ID video generation timeout');
  } catch (error) {
    console.error('D-ID error:', error.response?.data || error.message);
    // Return null to trigger fallback
    return null;
  }
}

// ElevenLabs Speech-to-Text
export async function transcribeAudio(audioBuffer, filename = 'audio.webm') {
  try {
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
      filename,
      contentType: 'audio/webm',
    });
    formData.append('model_id', 'eleven_multilingual_v2');

    const response = await axios.post(
      'https://api.elevenlabs.io/v1/speech-to-text',
      formData,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          ...formData.getHeaders(),
        },
      }
    );

    return response.data.text;
  } catch (error) {
    console.error('ElevenLabs STT error:', error.response?.data || error.message);
    throw new Error('Failed to transcribe audio');
  }
}

// S3 Storage Functions
export async function uploadToS3(key, data, contentType = 'application/json') {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `s3://${process.env.S3_BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload to S3');
  }
}

export async function getFromS3(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const data = await streamToString(response.Body);
    return JSON.parse(data);
  } catch (error) {
    console.error('S3 download error:', error);
    throw new Error('Failed to download from S3');
  }
}

export async function getS3SignedUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
}

// Helper function to convert stream to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// Upload audio to S3 and return public URL
export async function uploadAudioToS3(audioBuffer, sessionId, questionIndex) {
  const key = `sessions/${sessionId}/audio_q${questionIndex}.mp3`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: audioBuffer,
    ContentType: 'audio/mpeg',
  }));

  // Return signed URL valid for 1 hour
  return await getS3SignedUrl(key, 3600);
}
