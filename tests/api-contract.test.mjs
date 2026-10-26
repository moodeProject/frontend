import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const clientSource = (await readFile(new URL('../src/api/client.js', import.meta.url), 'utf8'))
  .replace('import.meta.env.VITE_API_URL', "'http://safeon.test'");
const clientUrl = `data:text/javascript;base64,${Buffer.from(clientSource).toString('base64')}`;
async function loadApi(name) {
  const source = (await readFile(new URL(`../src/api/${name}.js`, import.meta.url), 'utf8'))
    .replace(/from '\.\/client'/g, `from '${clientUrl}'`);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const calls = [];
let handler;
globalThis.fetch = async (url, options) => {
  const request = { path: new URL(url).pathname, method: options.method, body: options.body ? JSON.parse(options.body) : undefined, headers: options.headers };
  calls.push(request);
  return handler(request);
};
const ok = data => new Response(JSON.stringify({ success: true, data }), { status: 200 });

await test('helmet lifecycle persists changes through the documented API', async () => {
  calls.length = 0;
  const helmets = await loadApi('helmets');
  let row;
  handler = request => {
    if (request.method === 'POST' && request.path === '/api/helmets') {
      assert.equal(request.body.deviceId, 'helmet-mixedCase');
      row = { id: 42, ...request.body };
    } else if (request.path.endsWith('/assign')) row.workerId = request.body.workerId;
    else if (request.path.endsWith('/unassign')) row.workerId = null;
    else if (request.method === 'PUT') row.memo = request.body.memo;
    else if (request.method === 'DELETE') row = null;
    return ok(request.method === 'GET' ? (row ? [row] : []) : row);
  };
  await helmets.createHelmet({ helmetNumber: 'H-042', deviceId: 'helmet-mixedCase', memo: '등록' });
  await helmets.assignHelmet(42, '7');
  assert.equal((await helmets.getHelmets())[0].workerId, 7);
  await helmets.updateHelmet(42, { memo: '' });
  assert.equal((await helmets.getHelmets())[0].memo, '');
  await helmets.reconnectHelmet(42);
  assert(calls.some(call => call.path === '/api/helmets/42/reconnect' && call.method === 'POST'));
  await helmets.unassignHelmet(42);
  assert.equal((await helmets.getHelmets())[0].workerId, null);
  await helmets.deleteHelmet(42);
  assert.deepEqual(await helmets.getHelmets(), []);
});

await test('Swagger worker login produces numeric attendance identity and bearer token', async () => {
  const auth = await loadApi('auth');
  const attendance = await loadApi('attendance');
  handler = request => {
    if (request.path === '/api/auth/login') {
      assert.deepEqual(request.body, { loginId: 'WK-0007', password: 'test-only', userType: 'WORKER' });
      return ok({ accessToken: 'test-token', userId: 7, userType: 'WORKER', loginId: 'WK-0007', name: '테스트' });
    }
    assert.equal(request.headers.Authorization, 'Bearer test-token');
    if (request.path === '/api/auth/me') return ok({ userId: 7, userType: 'WORKER', loginId: 'WK-0007', name: '테스트' });
    assert.deepEqual(request.body, { workerId: 7 });
    return ok({ workerId: 7 });
  };
  const { user } = await auth.loginApi('WK-0007', 'test-only', 'WORKER');
  assert.equal(user.id, 7);
  assert.equal(user.role, 'WORKER');
  assert.equal(auth.isWorkerUser(user), true);
  assert.equal(auth.isAdminUser(user), false);
  await attendance.checkIn(user.id);
  await attendance.checkOut(user.id);
  const count = calls.length;
  await assert.rejects(() => attendance.checkIn('WK-0007'));
  assert.equal(calls.length, count, 'invalid identity must never be sent to the server');
});

await test('zones use the public API prefix and unwrap the response', async () => {
  const zones = await loadApi('zones');
  handler = request => {
    assert.equal(request.path, '/api/zones');
    return ok([{ id: 1, code: 'ZONE-01', name: '구역 1' }]);
  };
  assert.equal((await zones.getZones())[0].id, 1);
});

await test('server failures preserve HTTP status and endpoint for diagnosis', async () => {
  const helmets = await loadApi('helmets');
  handler = () => new Response(JSON.stringify({ message: '로그인이 필요합니다.', code: 'UNAUTHENTICATED' }), { status: 401 });
  await assert.rejects(helmets.getHelmets, error => error.status === 401 && error.code === 'UNAUTHENTICATED' && error.message.includes('/api/helmets'));
});
