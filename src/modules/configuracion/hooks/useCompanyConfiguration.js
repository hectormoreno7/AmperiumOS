import { useEffect, useState } from 'react'
import {
  DEFAULT_CONFIGURATION,
  subscribeToConfiguration,
} from '../services/configuracionService'

export default function useCompanyConfiguration() {
  const [configuration, setConfiguration] =
    useState(DEFAULT_CONFIGURATION)

  useEffect(
    () =>
      subscribeToConfiguration(
        setConfiguration,
        () => {},
      ),
    [],
  )

  return configuration
}
