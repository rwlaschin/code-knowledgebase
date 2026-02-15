"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Metric_1 = require("../src/db/models/Metric");
describe('Metric model', () => {
    const validDoc = {
        instance_id: 'test-instance',
        operation: 'scan',
        started_at: new Date(),
        ended_at: new Date(),
        duration_ms: 100,
        status: 'ok'
    };
    it('constructs with required fields', () => {
        const m = new Metric_1.Metric(validDoc);
        expect(m.instance_id).toBe('test-instance');
        expect(m.operation).toBe('scan');
        expect(m.status).toBe('ok');
        expect(m.duration_ms).toBe(100);
    });
    it('accepts optional error_code and metadata', () => {
        const m = new Metric_1.Metric({
            ...validDoc,
            error_code: 'E001',
            metadata: { key: 'value' }
        });
        expect(m.error_code).toBe('E001');
        expect(m.metadata).toEqual({ key: 'value' });
    });
    it('validates status enum', () => {
        const ok = new Metric_1.Metric({ ...validDoc, status: 'ok' });
        const err = new Metric_1.Metric({ ...validDoc, status: 'error' });
        expect(ok.status).toBe('ok');
        expect(err.status).toBe('error');
    });
});
