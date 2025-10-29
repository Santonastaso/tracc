import { createEntityStore } from '@santonastaso/shared';

/**
 * Inbound Store
 * Manages inbound movements data
 * Uses the store factory pattern for consistency
 */
export const useInboundStore = createEntityStore('inbound');

