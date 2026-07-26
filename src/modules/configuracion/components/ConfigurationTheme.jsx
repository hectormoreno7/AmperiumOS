import { useEffect } from 'react'
import {
  applyConfigurationTheme,
  subscribeToConfiguration,
} from '../services/configuracionService'

function ConfigurationTheme() {
  useEffect(
    () =>
      subscribeToConfiguration(
        applyConfigurationTheme,
        () => {},
      ),
    [],
  )

  return null
}

export default ConfigurationTheme
