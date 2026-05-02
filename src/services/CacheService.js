"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const ConfigurationService_1 = require("./ConfigurationService");
class CacheService {
    constructor() {
        this.cache = new Map();
        this.accessOrder = [];
    }
    set(key, value) {
        const maxTextLength = ConfigurationService_1.configurationService.getCacheMaxTextLength();
        if (value.length > maxTextLength) {
            value = value.slice(0, maxTextLength) + '...';
        }
        if (value.length == 0)
            return;
        this.cache.set(key, { value, timestamp: Date.now() });
        this.updateAccessOrder(key);
        this.evictIfNeeded();
    }
    get(key) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.timestamp = Date.now();
            this.updateAccessOrder(key);
            return entry.value;
        }
        return undefined;
    }
    clearByUri(uriKey) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(uriKey + ':')) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
        }
    }
    updateAccessOrder(key) {
        this.removeFromAccessOrder(key);
        this.accessOrder.push(key);
    }
    removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }
    evictIfNeeded() {
        const maxFiles = ConfigurationService_1.configurationService.getCacheMaxFiles();
        const uriSet = new Set();
        for (const key of this.accessOrder) {
            const uri = this.extractUri(key);
            if (uriSet.has(uri)) {
                continue;
            }
            uriSet.add(uri);
        }
        while (uriSet.size > maxFiles) {
            const oldestUri = this.findOldestUri(uriSet);
            if (oldestUri) {
                this.clearByUri(oldestUri);
                uriSet.delete(oldestUri);
            }
        }
    }
    extractUri(key) {
        const lastColonIndex = key.lastIndexOf(':');
        return lastColonIndex !== -1 ? key.substring(0, lastColonIndex) : key;
    }
    findOldestUri(uriSet) {
        let oldestUri = null;
        let oldestTime = Infinity;
        for (const uri of uriSet) {
            let minTime = Infinity;
            for (const key of this.cache.keys()) {
                if (key.startsWith(uri + ':')) {
                    const entry = this.cache.get(key);
                    if (entry && entry.timestamp < minTime) {
                        minTime = entry.timestamp;
                    }
                }
            }
            if (minTime < oldestTime) {
                oldestTime = minTime;
                oldestUri = uri;
            }
        }
        return oldestUri;
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
