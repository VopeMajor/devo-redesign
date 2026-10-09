/**
 * Exporta as falas dubladas (lib/devo/voice-lines.ts) como JSON para o gerador de voz.
 *   npx -y tsx scripts/voz/exportar.ts > /tmp/linhas.json
 */
import { buildVoiceLines } from '../../lib/devo/voice-lines'

process.stdout.write(JSON.stringify(buildVoiceLines(), null, 2))
