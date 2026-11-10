import {ExpoConfig, ConfigContext} from 'expo/config';
export default ({config}: ConfigContext): ExpoConfig => {
  const base = process.env.PULSO_BASE_PATH?.replace(/\/$/, '');
  return {...config, name: config.name ?? 'Pulso', slug: config.slug ?? 'pulso-rutinas',
    web: {...config.web, output: 'single'},
    experiments: {...config.experiments, ...(base ? {baseUrl: base} : {})}};
};
