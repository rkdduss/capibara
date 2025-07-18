import styled from "styled-components/native";

interface Props {
  action: () => void;
  text: string;
  disabled?: boolean;
  style?: "small" | "default" | "medium"
}

export const PrimaryButton = ({ action, text, disabled = false, style }: Props) => {
  
  if (style == "medium")
    return (
      <Container isDisabled={disabled} disabled={disabled} onPress={action} style={style && {
        width:"49%"
      }}>
        <ButtonText isDisabled={disabled}>{text}</ButtonText>
      </Container>  
    );

  return (
    <Container isDisabled={disabled} disabled={disabled} onPress={action} style={style && {
      width:120
    }}>
      <ButtonText isDisabled={disabled}>{text}</ButtonText>
    </Container>  
  );
};

const Container = styled.TouchableOpacity<{ isDisabled: boolean }>`
  width: 100%;
  height: 55px;
  border-radius: 10px;
  background-color: ${({ isDisabled }) => (isDisabled ? "#F3F4F5" : "#5457f7")};
  justify-content: center;
  align-items: center;
`;

const ButtonText = styled.Text<{ isDisabled: boolean }>`
  font-size: 16px;
  font-family: 'Pretendard-SemiBold';
  color: ${({ isDisabled }) => (!isDisabled ? "white" : "#BFBFBF")};
`;