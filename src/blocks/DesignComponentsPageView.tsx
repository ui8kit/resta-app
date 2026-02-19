import {
  Block,
  Stack,
  Title,
  Text,
  Button,
  Badge,
  Field,
  Icon,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Group,
  Grid,
} from '@ui8kit/core';
import {
  Home,
  Menu,
  UtensilsCrossed,
  ShoppingCart,
  User,
  Settings,
  Sun,
  Moon,
  ChevronRight,
  Heart,
} from 'lucide-react';

const BUTTON_VARIANTS = ['default', 'primary', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
const BUTTON_SIZES = ['xs', 'sm', 'default', 'lg', 'xl', 'icon'] as const;
const BADGE_VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'] as const;
const BADGE_SIZES = ['xs', 'sm', 'default', 'lg'] as const;

export function DesignComponentsPageView() {
  return (
    <Block component="section" py="8" data-class="design-components-section">
      <Stack gap="8" max="w-4xl" mx="auto" px="4" items="stretch">
        <Title fontSize="2xl" fontWeight="bold" data-class="design-components-title">
          Components
        </Title>

        <Card data-class="design-components-card">
          <CardHeader>
            <CardTitle order={4}>Button variants</CardTitle>
            <CardDescription>default, primary, destructive, outline, secondary, ghost, link</CardDescription>
          </CardHeader>
          <CardContent>
            <Group gap="2" wrap="" data-class="design-components-button-variants">
              {BUTTON_VARIANTS.map((v) => (
                <Button key={v} variant={v} size="sm" data-class="design-components-button">
                  {v}
                </Button>
              ))}
            </Group>
          </CardContent>
        </Card>

        <Card data-class="design-components-card">
          <CardHeader>
            <CardTitle order={4}>Button sizes</CardTitle>
            <CardDescription>xs, sm, default, lg, xl, icon</CardDescription>
          </CardHeader>
          <CardContent>
            <Group gap="2" items="center" wrap="" data-class="design-components-button-sizes">
              {BUTTON_SIZES.map((s) => (
                <Button key={s} variant="outline" size={s} data-class="design-components-button">
                  {s === 'icon' ? <Icon lucideIcon={Settings} size="sm" /> : s}
                </Button>
              ))}
            </Group>
          </CardContent>
        </Card>

        <Card data-class="design-components-card">
          <CardHeader>
            <CardTitle order={4}>Badge variants</CardTitle>
            <CardDescription>default, secondary, destructive, outline, success, warning, info</CardDescription>
          </CardHeader>
          <CardContent>
            <Group gap="2" wrap="" data-class="design-components-badge-variants">
              {BADGE_VARIANTS.map((v) => (
                <Badge key={v} variant={v} data-class="design-components-badge">
                  {v}
                </Badge>
              ))}
            </Group>
          </CardContent>
        </Card>

        <Card data-class="design-components-card">
          <CardHeader>
            <CardTitle order={4}>Badge sizes</CardTitle>
            <CardDescription>xs, sm, default, lg</CardDescription>
          </CardHeader>
          <CardContent>
            <Group gap="2" items="center" wrap="" data-class="design-components-badge-sizes">
              {BADGE_SIZES.map((s) => (
                <Badge key={s} variant="secondary" size={s} data-class="design-components-badge">
                  {s}
                </Badge>
              ))}
            </Group>
          </CardContent>
        </Card>

        <Card data-class="design-components-card">
          <CardHeader>
            <CardTitle order={4}>Field types</CardTitle>
            <CardDescription>text, email, password, textarea, checkbox, radio, select</CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap="4" max="w-md" data-class="design-components-fields">
              <Block data-class="design-components-field-row">
                <Text fontSize="xs" textColor="muted-foreground" mb="1">
                  text
                </Text>
                <Field type="text" placeholder="Enter text" data-class="design-components-field" />
              </Block>
              <Block data-class="design-components-field-row">
                <Text fontSize="xs" textColor="muted-foreground" mb="1">
                  email
                </Text>
                <Field type="email" placeholder="email@example.com" data-class="design-components-field" />
              </Block>
              <Block data-class="design-components-field-row">
                <Text fontSize="xs" textColor="muted-foreground" mb="1">
                  password
                </Text>
                <Field type="password" placeholder="••••••••" data-class="design-components-field" />
              </Block>
              <Block data-class="design-components-field-row">
                <Text fontSize="xs" textColor="muted-foreground" mb="1">
                  textarea
                </Text>
                <Field component="textarea" rows={3} placeholder="Message" data-class="design-components-field" />
              </Block>
              <Block data-class="design-components-field-row">
                <Text fontSize="xs" textColor="muted-foreground" mb="1">
                  checkbox
                </Text>
                <Group gap="2" items="center">
                  <Field type="checkbox" id="cb1" data-class="design-components-field" />
                  <Text component="label" fontSize="sm" htmlFor="cb1">
                    Label
                  </Text>
                </Group>
              </Block>
              <Block data-class="design-components-field-row">
                <Text fontSize="xs" textColor="muted-foreground" mb="1">
                  radio
                </Text>
                <Group gap="2" items="center">
                  <Field type="radio" name="choice" value="a" id="ra" data-class="design-components-field" />
                  <Text component="label" fontSize="sm" htmlFor="ra">
                    Option A
                  </Text>
                  <Field type="radio" name="choice" value="b" id="rb" data-class="design-components-field" />
                  <Text component="label" fontSize="sm" htmlFor="rb">
                    Option B
                  </Text>
                </Group>
              </Block>
              <Block data-class="design-components-field-row">
                <Text fontSize="xs" textColor="muted-foreground" mb="1">
                  select
                </Text>
                <Field component="select" data-class="design-components-field">
                  <option value="">Select...</option>
                  <option value="1">Option 1</option>
                  <option value="2">Option 2</option>
                </Field>
              </Block>
            </Stack>
          </CardContent>
        </Card>

        <Card data-class="design-components-card">
          <CardHeader>
            <CardTitle order={4}>Icon samples</CardTitle>
            <CardDescription>Lucide icons at xs, sm, md, lg, xl</CardDescription>
          </CardHeader>
          <CardContent>
            <Grid cols="1-2-3" gap="4" data-class="design-components-icons">
              {[
                { Icon: Home, label: 'Home' },
                { Icon: Menu, label: 'Menu' },
                { Icon: UtensilsCrossed, label: 'Utensils' },
                { Icon: ShoppingCart, label: 'Cart' },
                { Icon: User, label: 'User' },
                { Icon: Settings, label: 'Settings' },
                { Icon: Sun, label: 'Sun' },
                { Icon: Moon, label: 'Moon' },
                { Icon: ChevronRight, label: 'Chevron' },
                { Icon: Heart, label: 'Heart' },
              ].map(({ Icon: I, label }) => (
                <Block key={label} data-class="design-components-icon-row">
                  <Group gap="2" items="center" data-class="design-components-icon-group">
                    <Icon lucideIcon={I} size="xs" />
                    <Icon lucideIcon={I} size="sm" />
                    <Icon lucideIcon={I} size="md" />
                    <Icon lucideIcon={I} size="lg" />
                    <Icon lucideIcon={I} size="xl" />
                  </Group>
                  <Text fontSize="xs" textColor="muted-foreground" mt="1">
                    {label}
                  </Text>
                </Block>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Block>
  );
}
