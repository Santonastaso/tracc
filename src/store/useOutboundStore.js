import { createEntityStore } from '@santonastaso/shared';

/**
 * Outbound Store
 * Manages outbound movements data
 * Uses the store factory pattern for consistency
 */
export const useOutboundStore = createEntityStore('outbound');

