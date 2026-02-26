import { DesignLayout } from '@/layouts';
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
import { If, Else, Loop, Var } from '@ui8kit/dsl';
import { getIconByName } from '@/lib/icon-map';
import type { ComponentsFixture, NavItem, SidebarLink } from '@/types';

export interface ComponentsPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  components: ComponentsFixture;
}

export function ComponentsPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  components,
}: ComponentsPageViewProps) {
  const {
    buttonVariants,
    buttonSizes,
    badgeVariants,
    badgeSizes,
    iconSamples,
    fieldTypes,
  } = components;

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-components-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-components-stack">
          <Block flex="col" gap="2" data-class="design-components-header">
            <Title fontSize="2xl" fontWeight="bold" data-class="design-components-title">
              <Var name="components.title" value={components.title} />
            </Title>
            <Text fontSize="sm" textColor="muted-foreground" data-class="design-components-subtitle">
              <Var name="components.subtitle" value={components.subtitle} />
            </Text>
          </Block>

          <Card data-class="design-components-card">
            <CardHeader>
              <CardTitle order={4}>Button variants</CardTitle>
              <CardDescription>default, primary, destructive, outline, secondary, ghost, link</CardDescription>
            </CardHeader>
            <CardContent>
              <Group gap="2" flex="wrap" data-class="design-components-button-variants">
                <Loop each="buttonVariants" as="v" data={buttonVariants}>
                  {(v) => (
                    <Button variant={v as never} size="sm" data-class="design-components-button">
                      <Var name="v" value={v} />
                    </Button>
                  )}
                </Loop>
              </Group>
            </CardContent>
          </Card>

          <Card data-class="design-components-card">
            <CardHeader>
              <CardTitle order={4}>Button sizes</CardTitle>
              <CardDescription>xs, sm, default, lg, xl, icon</CardDescription>
            </CardHeader>
            <CardContent>
              <Group gap="2" items="center" flex="wrap" data-class="design-components-button-sizes">
                <Loop each="buttonSizes" as="s" data={buttonSizes}>
                  {(s) => (
                    <Button variant="outline" size={s as never} data-class="design-components-button">
                      <If test="s === 'icon'" value={s === 'icon'}>
                        <Icon lucideIcon={getIconByName('Settings')!} size="sm" />
                      </If>
                      <Else>
                        <Var name="s" value={s} />
                      </Else>
                    </Button>
                  )}
                </Loop>
              </Group>
            </CardContent>
          </Card>

          <Card data-class="design-components-card">
            <CardHeader>
              <CardTitle order={4}>Badge variants</CardTitle>
              <CardDescription>default, secondary, destructive, outline, success, warning, info</CardDescription>
            </CardHeader>
            <CardContent>
              <Group gap="2" flex="wrap" data-class="design-components-badge-variants">
                <Loop each="badgeVariants" as="v" data={badgeVariants}>
                  {(v) => (
                    <Badge variant={v as never} data-class="design-components-badge">
                      <Var name="v" value={v} />
                    </Badge>
                  )}
                </Loop>
              </Group>
            </CardContent>
          </Card>

          <Card data-class="design-components-card">
            <CardHeader>
              <CardTitle order={4}>Badge sizes</CardTitle>
              <CardDescription>xs, sm, default, lg</CardDescription>
            </CardHeader>
            <CardContent>
              <Group gap="2" items="center" flex="wrap" data-class="design-components-badge-sizes">
                <Loop each="badgeSizes" as="s" data={badgeSizes}>
                  {(s) => (
                    <Badge variant="secondary" size={s as never} data-class="design-components-badge">
                      <Var name="s" value={s} />
                    </Badge>
                  )}
                </Loop>
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
                <Loop each="fieldTypes" as="f" data={fieldTypes}>
                  {(f) => (
                    <Block key={f.type} data-class="design-components-field-row">
                      <Text fontSize="xs" textColor="muted-foreground" mb="1">
                        <Var name="f.label" value={f.label} />
                      </Text>
                      <If test="f.type === 'text'" value={f.type === 'text'}>
                        <Field type="text" placeholder={f.placeholder} data-class="design-components-field" />
                      </If>
                      <If test="f.type === 'email'" value={f.type === 'email'}>
                        <Field type="email" placeholder={f.placeholder} data-class="design-components-field" />
                      </If>
                      <If test="f.type === 'password'" value={f.type === 'password'}>
                        <Field type="password" placeholder={f.placeholder} data-class="design-components-field" />
                      </If>
                      <If test="f.type === 'textarea'" value={f.type === 'textarea'}>
                        <Field component="textarea" rows={f.rows ?? 3} placeholder={f.placeholder} data-class="design-components-field" />
                      </If>
                      <If test="f.type === 'checkbox'" value={f.type === 'checkbox'}>
                        <Group gap="2" items="center">
                          <Field type="checkbox" id={`cb-${f.type}`} data-class="design-components-field" />
                          <Text component="label" fontSize="sm" htmlFor={`cb-${f.type}`}>
                            <Var name="f.optionLabel" value={f.optionLabel ?? 'Label'} />
                          </Text>
                        </Group>
                      </If>
                      <If test="f.type === 'radio'" value={f.type === 'radio'}>
                        <Group gap="2" items="center">
                          <Loop each="f.options" as="opt" data={f.options ?? []}>
                            {(opt) => (
                              <Group gap="2" items="center">
                                <Field type="radio" name={`choice-${f.type}`} value={opt.value} id={`ra-${f.type}-${opt.value}`} data-class="design-components-field" />
                                <Text component="label" fontSize="sm" htmlFor={`ra-${f.type}-${opt.value}`}>
                                  <Var name="opt.label" value={opt.label} />
                                </Text>
                              </Group>
                            )}
                          </Loop>
                        </Group>
                      </If>
                      <If test="f.type === 'select'" value={f.type === 'select'}>
                        <Field component="select" data-class="design-components-field">
                          <Loop each="f.options" as="opt" data={f.options ?? []}>
                            {(opt) => <option value={opt.value}><Var name="opt.label" value={opt.label} /></option>}
                          </Loop>
                        </Field>
                      </If>
                    </Block>
                  )}
                </Loop>
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
                <Loop each="iconSamples" as="sample" data={iconSamples}>
                  {(sample) => {
                    const IconComponent = getIconByName(sample.icon);
                    if (!IconComponent) return null;
                    return (
                      <Block key={sample.label} data-class="design-components-icon-row">
                        <Group gap="2" items="center" data-class="design-components-icon-group">
                          <Icon lucideIcon={IconComponent} size="xs" />
                          <Icon lucideIcon={IconComponent} size="sm" />
                          <Icon lucideIcon={IconComponent} size="md" />
                          <Icon lucideIcon={IconComponent} size="lg" />
                          <Icon lucideIcon={IconComponent} size="xl" />
                        </Group>
                        <Text fontSize="xs" textColor="muted-foreground" mt="1">
                          <Var name="sample.label" value={sample.label} />
                        </Text>
                      </Block>
                    );
                  }}
                </Loop>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      </Block>
    </DesignLayout>
  );
}
