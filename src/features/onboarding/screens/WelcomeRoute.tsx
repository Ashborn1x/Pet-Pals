import { Alert } from 'react-native';
import { WelcomeScreen } from '../../../components/WelcomeScreen';

export function WelcomeRoute() {
  const handleAddPet = () => {
    Alert.alert('Add a Pet', 'The pet profile flow is ready to be connected.');
  };

  return <WelcomeScreen onAddPet={handleAddPet} />;
}
