import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface VerificationCodeEmailProps {
  code: string;
}

export function VerificationCodeEmail({ code }: VerificationCodeEmailProps) {
  return (
    <Html lang='ko'>
      <Head />
      <Preview>Sunrinthon 인증번호: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Sunrinthon 인증번호</Heading>
          <Text style={paragraph}>회원가입을 완료하려면 아래 인증번호를 입력해 주세요.</Text>
          <Section style={codeSection}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={footnote}>
            인증번호는 5분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해 주세요.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e4e4e7',
  borderRadius: '12px',
  margin: '40px auto',
  padding: '32px 28px',
  maxWidth: '480px',
};

const heading = {
  color: '#18181b',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '32px',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#52525b',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 24px',
};

const codeSection = {
  backgroundColor: '#fafafa',
  border: '1px dashed #d4d4d8',
  borderRadius: '8px',
  margin: '0 0 24px',
  padding: '20px 0',
  textAlign: 'center' as const,
};

const codeText = {
  color: '#18181b',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '8px',
  lineHeight: '40px',
  margin: 0,
};

const footnote = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: 0,
};
