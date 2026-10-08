"""Prepare the licensed Mixkit 1789 WAV: python3 scripts/prepare-night-audio.py input.wav.
Keeps stereo / 44.1 kHz PCM; softens treble and crossfades the loop boundary.
"""
import array
import math
from pathlib import Path
import sys
import wave

with wave.open(sys.argv[1]) as source:
    rate, channels = source.getframerate(), source.getnchannels()
    assert source.getsampwidth() == 2, 'Expected 16-bit PCM'
    samples = array.array('h', source.readframes(source.getnframes()))
if sys.byteorder != 'little':
    samples.byteswap()
frames = len(samples) // channels
processed = []
alpha = 1 - math.exp(-2 * math.pi * 6000 / rate)
overlap = round(2 * rate)
for channel in range(channels):
    data = array.array('f')
    low1 = low2 = 0.0
    for i in range(channel, len(samples), channels):
        low1 += alpha * (samples[i] / 32768 - low1)
        low2 += alpha * (low1 - low2)
        data.append(low2)
    # Tail fades into head; wrap continues at the end of the head segment.
    loop = data[overlap:frames - overlap]
    for i in range(overlap):
        t = i / (overlap - 1)
        loop.append(data[frames - overlap + i] * math.cos(t * math.pi / 2)
                    + data[i] * math.sin(t * math.pi / 2))
    processed.append(loop)
count = sum(len(channel) for channel in processed)
rms = math.sqrt(sum(x*x for channel in processed for x in channel) / count)
peak = max(abs(x) for channel in processed for x in channel)
gain = min(0.009 / rms, 0.05 / peak, 1)
result = array.array('h', (round(processed[ch][i] * gain * 32767)
                         for i in range(len(processed[0])) for ch in range(channels)))
if sys.byteorder != 'little':
    result.byteswap()
output = Path(__file__).resolve().parents[1] / 'public/audio/night-crickets.wav'
with wave.open(str(output), 'wb') as target:
    target.setparams((channels, 2, rate, 0, 'NONE', 'not compressed'))
    target.writeframes(result.tobytes())
print(f'{output.name}: {len(processed[0])/rate:.1f}s, RMS {rms*gain:.4f}, peak {peak*gain:.4f}')
