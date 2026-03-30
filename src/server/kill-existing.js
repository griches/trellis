import { execSync } from 'child_process';
import net from 'net';

/**
 * Check if a port is in use by attempting a TCP connection.
 */
function isPortInUse(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

/**
 * Kill whatever is listening on `port`, but only if something is actually there.
 * Uses a fast TCP probe first; only falls back to lsof when needed.
 */
export async function killExistingServer(port) {
  const inUse = await isPortInUse(port);
  if (!inUse) return;

  try {
    const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    if (output) {
      for (const pid of output.split('\n')) {
        try {
          process.kill(parseInt(pid), 'SIGTERM');
        } catch {
          // Process already gone
        }
      }
      // Brief wait for the port to be released
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  } catch {
    // No process on this port — nothing to kill
  }
}
