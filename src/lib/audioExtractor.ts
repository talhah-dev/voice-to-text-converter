/**
 * Extracts the audio track from a video file in the browser using the Web Audio API
 * and encodes it into a compact 16kHz mono WAV file optimized for Whisper AI.
 */

function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample: number;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (offset < len) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export async function extractAudioFromVideo(videoFile: File): Promise<{
  audioFile: File;
  duration: number;
  extractedSize: number;
}> {
  try {
    const arrayBuffer = await videoFile.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtx();

    // Decode container audio data into AudioBuffer
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();

    // Downsample to 16kHz mono (native sample rate for Whisper AI models)
    const targetSampleRate = 16000;
    const targetLength = Math.ceil(decodedBuffer.duration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampledBuffer = await offlineCtx.startRendering();
    const wavBlob = bufferToWave(resampledBuffer, resampledBuffer.length);

    const baseName = videoFile.name.replace(/\.[^/.]+$/, '');
    const audioFile = new File([wavBlob], `${baseName}-audio.wav`, {
      type: 'audio/wav',
      lastModified: Date.now(),
    });

    return {
      audioFile,
      duration: decodedBuffer.duration,
      extractedSize: wavBlob.size,
    };
  } catch (err) {
    console.warn(
      'Web Audio decoding failed for this video format, passing video directly to Whisper API:',
      err
    );
    // Whisper natively accepts .mp4 and .webm files under 25MB
    return {
      audioFile: videoFile,
      duration: 0,
      extractedSize: videoFile.size,
    };
  }
}

