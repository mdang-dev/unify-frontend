import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';

const PreferenceSection = ({ title, description, children }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default PreferenceSection;
