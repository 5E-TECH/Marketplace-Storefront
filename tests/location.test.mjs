import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

class ApiError extends Error { constructor(status, message, details, kind) { super(message); this.status = status; this.details = details; this.kind = kind; } }

test('location service loads and normalizes backend regions and districts', async () => {
  const calls = [];
  const { locationService } = loadTypeScript('src/services/location.service.ts', { '@/lib/api': {
    ApiError,
    apiRequest: async (path, options) => {
      calls.push(path);
      const value = path === '/regions'
        ? [{ id: 1, name: ' Toshkent shahri ' }, { id: '1', name: 'Toshkent shahri' }]
        : [{ id: 2, regionId: 1, name: ' Chilonzor ' }];
      assert.equal(options.validate(value), true);
      return value;
    },
  } });
  assert.deepEqual(await locationService.listRegions(), [{ id: '1', name: 'Toshkent shahri' }]);
  assert.deepEqual(await locationService.listDistricts('1'), [{ id: '2', regionId: '1', name: 'Chilonzor' }]);
  assert.deepEqual(calls, ['/regions', '/regions/1/districts']);
});

test('location service rejects malformed responses, wrong parent IDs and unsafe IDs', async () => {
  let response = [{ id: '', name: 'No ID' }];
  const { locationService } = loadTypeScript('src/services/location.service.ts', { '@/lib/api': {
    ApiError,
    apiRequest: async (_path, options) => {
      if (!options.validate(response)) throw new ApiError(200, 'invalid', undefined, 'invalid_response');
      return response;
    },
  } });
  await assert.rejects(locationService.listRegions(), { kind: 'invalid_response' });
  response = [{ id: '2', regionId: 'another', name: 'Chilonzor' }];
  await assert.rejects(locationService.listDistricts('1'), { kind: 'invalid_response' });
  await assert.rejects(locationService.listDistricts('../admin'), { kind: 'configuration' });
});
