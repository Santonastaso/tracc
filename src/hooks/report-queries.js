import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { computeSiloAvailableItems, computeStockLevels } from '../lib/silo-levels';

export const useMovementsReport = (filters) =>
  useQuery({
    queryKey: ['movements-report', filters],
    queryFn: async () => {
      let query = supabase
        .from('inbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
        query = query.eq('silo_id', filters.siloId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: filters.reportType === 'movements',
  });

export const useOutboundReport = (filters) =>
  useQuery({
    queryKey: ['outbound-report', filters],
    queryFn: async () => {
      let query = supabase
        .from('outbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
        query = query.eq('silo_id', filters.siloId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: filters.reportType === 'outbound',
  });

export const useCombinedMovementsReport = (filters) =>
  useQuery({
    queryKey: ['combined-movements-report', filters],
    queryFn: async () => {
      let inboundQuery = supabase
        .from('inbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        inboundQuery = inboundQuery.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        inboundQuery = inboundQuery.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
        inboundQuery = inboundQuery.eq('silo_id', filters.siloId);
      }

      let outboundQuery = supabase
        .from('outbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        outboundQuery = outboundQuery.gte('created_at', filters.startDate + 'T00:00:00.000Z');
      }
      if (filters.endDate) {
        outboundQuery = outboundQuery.lte('created_at', filters.endDate + 'T23:59:59.999Z');
      }
      if (filters.siloId && filters.siloId !== 'all') {
        outboundQuery = outboundQuery.eq('silo_id', filters.siloId);
      }

      const [inboundResult, outboundResult] = await Promise.all([inboundQuery, outboundQuery]);

      if (inboundResult.error) throw inboundResult.error;
      if (outboundResult.error) throw outboundResult.error;

      return [
        ...inboundResult.data.map((item) => ({ ...item, movement_type: 'IN' })),
        ...outboundResult.data.map((item) => ({ ...item, movement_type: 'OUT' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    enabled: filters.reportType === 'combined',
  });

export const useStockReport = (filters, silosData) =>
  useQuery({
    queryKey: ['stock-report', filters],
    queryFn: async () => {
      let silos = silosData;
      if (!silos) {
        const { data, error: silosError } = await supabase.from('silos').select('*').order('id');
        if (silosError) throw silosError;
        silos = data;
      }

      let inboundQuery = supabase
        .from('inbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      let outboundQuery = supabase
        .from('outbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      if (filters.startDate) {
        const startDateTime = filters.startDate + 'T00:00:00.000Z';
        inboundQuery = inboundQuery.gte('created_at', startDateTime);
        outboundQuery = outboundQuery.gte('created_at', startDateTime);
      }
      if (filters.endDate) {
        const endDateTime = filters.endDate + 'T23:59:59.999Z';
        inboundQuery = inboundQuery.lte('created_at', endDateTime);
        outboundQuery = outboundQuery.lte('created_at', endDateTime);
      }
      if (filters.siloId && filters.siloId !== 'all') {
        inboundQuery = inboundQuery.eq('silo_id', filters.siloId);
        outboundQuery = outboundQuery.eq('silo_id', filters.siloId);
      }

      const { data: inboundData, error: inboundError } = await inboundQuery;
      if (inboundError) throw inboundError;

      const { data: outboundData, error: outboundError } = await outboundQuery;
      if (outboundError) throw outboundError;

      let stockLevels = computeStockLevels(silos, inboundData, outboundData);

      if (filters.siloId && filters.siloId !== 'all') {
        stockLevels = stockLevels.filter((silo) => silo.id === parseInt(filters.siloId));
      }
      return stockLevels;
    },
    enabled: filters.reportType === 'stock',
  });

export const useSnapshotReport = (filters, silosData) =>
  useQuery({
    queryKey: ['snapshot-report', filters],
    queryFn: async () => {
      if (!filters.snapshotDate || !filters.snapshotTime) {
        throw new Error('Data e ora snapshot sono richiesti');
      }

      const snapshotDateTime = `${filters.snapshotDate}T${filters.snapshotTime}:59.999Z`;

      let silos = silosData;
      if (!silos) {
        const { data, error: silosError } = await supabase.from('silos').select('*').order('id');
        if (silosError) throw silosError;
        silos = data;
      }

      let inboundQuery = supabase
        .from('inbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      let outboundQuery = supabase
        .from('outbound')
        .select('silo_id, quantity_kg, created_at')
        .order('created_at', { ascending: true });

      inboundQuery = inboundQuery.lte('created_at', snapshotDateTime);
      outboundQuery = outboundQuery.lte('created_at', snapshotDateTime);

      if (filters.siloId && filters.siloId !== 'all') {
        inboundQuery = inboundQuery.eq('silo_id', filters.siloId);
        outboundQuery = outboundQuery.eq('silo_id', filters.siloId);
      }

      const { data: inboundData, error: inboundError } = await inboundQuery;
      if (inboundError) throw inboundError;

      const { data: outboundData, error: outboundError } = await outboundQuery;
      if (outboundError) throw outboundError;

      let stockLevels = computeStockLevels(silos, inboundData, outboundData).map((silo) => ({
        ...silo,
        snapshotDateTime,
      }));

      if (filters.siloId && filters.siloId !== 'all') {
        stockLevels = stockLevels.filter((silo) => silo.id === parseInt(filters.siloId));
      }
      return stockLevels;
    },
    enabled: filters.reportType === 'snapshot' && !!filters.snapshotDate && !!filters.snapshotTime,
  });

export const useSnapshotSiloDetail = (selectedSnapshotSilo, filters) =>
  useQuery({
    queryKey: ['snapshot-silo-detail', selectedSnapshotSilo?.id, filters.snapshotDate, filters.snapshotTime],
    queryFn: async () => {
      if (!selectedSnapshotSilo || !filters.snapshotDate || !filters.snapshotTime) {
        return null;
      }

      const snapshotDateTime = `${filters.snapshotDate}T${filters.snapshotTime}:59.999Z`;

      const { data: inboundData, error: inboundError } = await supabase
        .from('inbound')
        .select(
          `
          id,
          silo_id,
          quantity_kg,
          created_at,
          product,
          lot_supplier,
          lot_tf,
          proteins,
          humidity,
          cleaned
        `
        )
        .eq('silo_id', selectedSnapshotSilo.id)
        .lte('created_at', snapshotDateTime)
        .order('created_at', { ascending: true });

      if (inboundError) throw inboundError;

      const { data: outboundData, error: outboundError } = await supabase
        .from('outbound')
        .select('silo_id, quantity_kg, items, created_at')
        .eq('silo_id', selectedSnapshotSilo.id)
        .lte('created_at', snapshotDateTime)
        .order('created_at', { ascending: true });

      if (outboundError) throw outboundError;

      const availableItems = computeSiloAvailableItems(
        selectedSnapshotSilo.id,
        inboundData,
        outboundData
      );

      const totalInbound = inboundData.reduce((sum, inb) => sum + inb.quantity_kg, 0);
      const totalOutbound = outboundData.reduce((sum, out) => sum + out.quantity_kg, 0);
      const currentLevel = totalInbound - totalOutbound;

      return {
        ...selectedSnapshotSilo,
        availableItems,
        currentLevel,
        totalInbound,
        totalOutbound,
        utilizationPercentage:
          selectedSnapshotSilo.capacity_kg > 0
            ? (currentLevel / selectedSnapshotSilo.capacity_kg) * 100
            : 0,
        snapshotDateTime,
      };
    },
    enabled: !!selectedSnapshotSilo && !!filters.snapshotDate && !!filters.snapshotTime,
  });
