import { describe, it, expect, vi } from 'vitest';
import { LayoutStage } from './LayoutStage';
import { ViewStage } from './ViewStage';
import { CssStage } from './CssStage';
import { HtmlStage } from './HtmlStage';
import { AssetStage } from './AssetStage';
import { DEFAULT_STAGES } from './index';

describe('Pipeline Stages', () => {
  describe('LayoutStage', () => {
    it('should have correct metadata', () => {
      const stage = new LayoutStage();
      
      expect(stage.name).toBe('layout');
      expect(stage.dependencies).toEqual([]);
    });
  });
  
  describe('ViewStage', () => {
    it('should have correct metadata', () => {
      const stage = new ViewStage();
      
      expect(stage.name).toBe('view');
      expect(stage.dependencies).toContain('layout');
    });
  });
  
  describe('CssStage', () => {
    it('should have correct metadata', () => {
      const stage = new CssStage();
      
      expect(stage.name).toBe('css');
      expect(stage.dependencies).toContain('view');
    });
  });
  
  describe('HtmlStage', () => {
    it('should have correct metadata', () => {
      const stage = new HtmlStage();
      
      expect(stage.name).toBe('html');
      expect(stage.dependencies).toContain('css');
    });
  });
  
  describe('AssetStage', () => {
    it('should have correct metadata', () => {
      const stage = new AssetStage();
      
      expect(stage.name).toBe('asset');
      expect(stage.dependencies).toContain('html');
    });
  });
  
  describe('DEFAULT_STAGES', () => {
    it('should contain all stages in correct order', () => {
      expect(DEFAULT_STAGES).toEqual(['layout', 'view', 'css', 'html', 'asset', 'mdx', 'template']);
    });
  });
});
