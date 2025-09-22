import { useEffect } from 'react';
import { useSilos, useInbound, useOutbound, useMaterials, useOperators } from './useQueries';
import { 
  useSilosStore, 
  useInboundStore, 
  useOutboundStore, 
  useMaterialsStore, 
  useOperatorsStore 
} from '../store';

/**
 * Custom hook to synchronize React Query data with Zustand stores
 * This ensures that both data fetching and state management work together seamlessly
 */
export const useStoreSync = () => {
  // React Query hooks
  const { data: silosData } = useSilos();
  const { data: inboundData } = useInbound();
  const { data: outboundData } = useOutbound();
  const { data: materialsData } = useMaterials();
  const { data: operatorsData } = useOperators();

  // Zustand stores
  const { setSilos } = useSilosStore();
  const { setInbound } = useInboundStore();
  const { setOutbound } = useOutboundStore();
  const { setMaterials } = useMaterialsStore();
  const { setOperators } = useOperatorsStore();

  // Sync silos data
  useEffect(() => {
    if (silosData) {
      setSilos(silosData);
    }
  }, [silosData, setSilos]);

  // Sync inbound data
  useEffect(() => {
    if (inboundData) {
      setInbound(inboundData);
    }
  }, [inboundData, setInbound]);

  // Sync outbound data
  useEffect(() => {
    if (outboundData) {
      setOutbound(outboundData);
    }
  }, [outboundData, setOutbound]);

  // Sync materials data
  useEffect(() => {
    if (materialsData) {
      setMaterials(materialsData);
    }
  }, [materialsData, setMaterials]);

  // Sync operators data
  useEffect(() => {
    if (operatorsData) {
      setOperators(operatorsData);
    }
  }, [operatorsData, setOperators]);
};

