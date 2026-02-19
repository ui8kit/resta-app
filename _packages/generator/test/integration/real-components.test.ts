/**
 * Integration test - Transform real React components to templates
 */

import { describe, it, expect } from 'vitest';
import { transformJsx } from '../../src/transformer';
import { LiquidPlugin, HandlebarsPlugin, TwigPlugin, LattePlugin } from '../../src/plugins/template/built-in';
import { findByAnnotation, getAnnotations } from '../../src/hast';

// =============================================================================
// Real Component Sources
// =============================================================================

const HERO_BLOCK = `
import { Block, Stack, Group, Title, Text, Button } from "@ui8kit/core";

export function HeroBlock() {
  return (
    <Block component="section" data-class="hero-section">
      <Stack gap="6" items="center" py="16">
        <Stack gap="4" items="center" data-class="hero-content">
          <Title
            fontSize="4xl"
            fontWeight="bold"
            textAlign="center"
            data-class="hero-title"
          >
            Welcome to UI8Kit
          </Title>

          <Text
            fontSize="xl"
            textColor="muted-foreground"
            textAlign="center"
            max="w-2xl"
            data-class="hero-description"
          >
            The next generation UI framework combining React development
            with semantic HTML5/CSS3 static generation.
          </Text>
        </Stack>

        <Group gap="4" data-class="hero-actions">
          <Button size="lg" data-class="hero-cta-primary">
            Get Started
          </Button>
          <Button variant="outline" size="lg" data-class="hero-cta-secondary">
            Learn More
          </Button>
        </Group>
      </Stack>
    </Block>
  );
}
`;

const FEATURES_BLOCK = `
import { Block, Grid, Stack, Title, Text, Icon } from "@ui8kit/core";
import { Zap, Shield, Code, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Zero-runtime styling with static generation."
  },
  {
    icon: Shield,
    title: "Type Safe",
    description: "Full TypeScript support with strict prop validation."
  }
];

export function FeaturesBlock() {
  return (
    <Block component="section" data-class="features-section">
      <Stack gap="8" py="16">
        <Stack gap="4" items="center" data-class="features-header">
          <Title fontSize="3xl" fontWeight="bold" textAlign="center">
            Why Choose UI8Kit?
          </Title>
        </Stack>

        <Grid cols="1-2-4" gap="6" data-class="features-grid">
          {features.map((feature, index) => (
            <Stack
              key={index}
              gap="4"
              p="6"
              rounded="lg"
              bg="card"
            >
              <Title fontSize="xl" fontWeight="semibold">
                {feature.title}
              </Title>
              <Text fontSize="sm" textColor="muted-foreground">
                {feature.description}
              </Text>
            </Stack>
          ))}
        </Grid>
      </Stack>
    </Block>
  );
}
`;

const CARD_WITH_CHILDREN = `
export function Card({ title, children, isActive }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {isActive && <span className="badge">Active</span>}
      <div className="content">
        {children}
      </div>
    </div>
  );
}
`;

// =============================================================================
// Tests
// =============================================================================

describe('Real Components Integration', () => {
  describe('HeroBlock', () => {
    it('transforms HeroBlock to HAST', () => {
      const result = transformJsx(HERO_BLOCK);
      
      expect(result.errors).toHaveLength(0);
      expect(result.tree.type).toBe('root');
      expect(result.tree.children.length).toBeGreaterThan(0);
      
      // Top-level component is Block, so we get its include
      expect(result.dependencies).toContain('partials/block');
    });
    
    it('detects component metadata', () => {
      const result = transformJsx(HERO_BLOCK);
      
      expect(result.tree.meta?.componentName).toBe('HeroBlock');
      expect(result.tree.meta?.componentType).toBe('block');
    });
  });
  
  describe('FeaturesBlock with loop', () => {
    // Note: FeaturesBlock uses only component references (Block, Grid, etc.)
    // The loop is inside Grid children which is itself a component
    // So we only see the top-level Block include
    it('transforms FeaturesBlock to HAST', () => {
      const result = transformJsx(FEATURES_BLOCK);
      
      expect(result.errors).toHaveLength(0);
      expect(result.tree.type).toBe('root');
      
      // Top-level is Block component
      expect(result.dependencies).toContain('partials/block');
    });
    
    it('detects component metadata', () => {
      const result = transformJsx(FEATURES_BLOCK);
      
      expect(result.tree.meta?.componentName).toBe('FeaturesBlock');
      expect(result.tree.meta?.componentType).toBe('block');
    });
  });
  
  describe('Card with children and conditional', () => {
    it('transforms Card with slot and condition', () => {
      const result = transformJsx(CARD_WITH_CHILDREN);
      
      expect(result.errors).toHaveLength(0);
      
      // Should detect slot
      const slots = findByAnnotation(result.tree, 'slot');
      expect(slots.length).toBeGreaterThan(0);
      
      // Should detect condition
      const conditions = findByAnnotation(result.tree, 'condition');
      expect(conditions.length).toBeGreaterThan(0);
      
      const condAnnotation = getAnnotations(conditions[0]);
      expect(condAnnotation?.condition?.expression).toBe('isActive');
      
      // Should detect variable
      expect(result.variables).toContain('title');
    });
    
    it('extracts props from Card', () => {
      const result = transformJsx(CARD_WITH_CHILDREN);
      
      const props = result.tree.meta?.props || [];
      const propNames = props.map(p => p.name);
      
      expect(propNames).toContain('title');
      expect(propNames).toContain('children');
      expect(propNames).toContain('isActive');
    });
  });
  
  describe('Plugin Integration', () => {
    it('generates Liquid template from Card', async () => {
      const result = transformJsx(CARD_WITH_CHILDREN);
      
      const plugin = new LiquidPlugin();
      await plugin.initialize({
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} } as any,
        config: { fileExtension: '.liquid', outputDir: './dist' },
        outputDir: './dist',
      });
      
      const output = await plugin.transform(result.tree);
      
      // Should contain Liquid syntax
      expect(output.content).toContain('{{ title }}');
      expect(output.content).toContain('{% if isActive %}');
      // Content slot
      expect(output.content).toMatch(/\{\{[^}]*content[^}]*\}\}/);
      
      await plugin.dispose();
    });
    
    it('generates Handlebars template from Card', async () => {
      const result = transformJsx(CARD_WITH_CHILDREN);
      
      const plugin = new HandlebarsPlugin();
      await plugin.initialize({
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} } as any,
        config: { fileExtension: '.hbs', outputDir: './dist' },
        outputDir: './dist',
      });
      
      const output = await plugin.transform(result.tree);
      
      // Should contain Handlebars syntax
      expect(output.content).toContain('{{title}}');
      expect(output.content).toContain('{{#if isActive}}');
      
      await plugin.dispose();
    });
    
    it('generates Twig template from FeaturesBlock', async () => {
      const result = transformJsx(FEATURES_BLOCK);
      
      const plugin = new TwigPlugin();
      await plugin.initialize({
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} } as any,
        config: { fileExtension: '.twig', outputDir: './dist' },
        outputDir: './dist',
      });
      
      const output = await plugin.transform(result.tree);
      
      // FeaturesBlock's top level is Block component, so we get include
      expect(output.content).toContain("{% include 'partials/block.twig'");
      
      await plugin.dispose();
    });
    
    it('generates Latte template from FeaturesBlock', async () => {
      const result = transformJsx(FEATURES_BLOCK);
      
      const plugin = new LattePlugin();
      await plugin.initialize({
        logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} } as any,
        config: { fileExtension: '.latte', outputDir: './dist' },
        outputDir: './dist',
      });
      
      const output = await plugin.transform(result.tree);
      
      // FeaturesBlock's top level is Block component, so we get include
      expect(output.content).toContain("{include 'partials/block.latte'");
      
      await plugin.dispose();
    });
  });
});
