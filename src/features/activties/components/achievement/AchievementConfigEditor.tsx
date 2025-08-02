'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Award,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Info,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/feedback/toast';

/**
 * Achievement configuration data structure
 */
export interface AchievementConfig {
  // Basic settings
  enableAchievements: boolean;
  enablePointsAnimation: boolean;
  celebrationLevel: 'minimal' | 'standard' | 'enthusiastic';
  
  // Points configuration
  basePoints: number;
  customPointsMultiplier: number;
  bonusPointsForPerfectScore: number;
  bonusPointsForSpeed: number;
  bonusPointsForFirstAttempt: number;
  
  // Achievement triggers
  enablePerfectScoreAchievement: boolean;
  enableSpeedAchievement: boolean;
  enableFirstAttemptAchievement: boolean;
  enableImprovementAchievement: boolean;
  
  // Speed thresholds (in seconds)
  speedBonusThreshold: number;
  
  // Preview data
  estimatedPoints: {
    minimum: number;
    average: number;
    maximum: number;
  };
}

/**
 * Default achievement configuration
 */
const DEFAULT_CONFIG: AchievementConfig = {
  enableAchievements: true,
  enablePointsAnimation: true,
  celebrationLevel: 'standard',
  basePoints: 20,
  customPointsMultiplier: 1.0,
  bonusPointsForPerfectScore: 10,
  bonusPointsForSpeed: 5,
  bonusPointsForFirstAttempt: 5,
  enablePerfectScoreAchievement: true,
  enableSpeedAchievement: true,
  enableFirstAttemptAchievement: true,
  enableImprovementAchievement: true,
  speedBonusThreshold: 60,
  estimatedPoints: {
    minimum: 20,
    average: 30,
    maximum: 40
  }
};

interface AchievementConfigEditorProps {
  activityType: string;
  initialConfig?: Partial<AchievementConfig>;
  onChange: (config: AchievementConfig) => void;
  className?: string;
}

/**
 * AchievementConfigEditor Component
 * 
 * Allows teachers to configure custom achievement points and settings per activity
 */
export function AchievementConfigEditor({
  activityType,
  initialConfig = {},
  onChange,
  className
}: AchievementConfigEditorProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<AchievementConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  // Update estimated points when config changes
  useEffect(() => {
    const basePoints = config.basePoints * config.customPointsMultiplier;
    const minimum = Math.floor(basePoints);
    const average = Math.floor(basePoints + (config.bonusPointsForFirstAttempt / 2));
    const maximum = Math.floor(
      basePoints + 
      config.bonusPointsForPerfectScore + 
      config.bonusPointsForSpeed + 
      config.bonusPointsForFirstAttempt
    );

    const updatedConfig = {
      ...config,
      estimatedPoints: { minimum, average, maximum }
    };

    setConfig(updatedConfig);
    onChange(updatedConfig);
  }, [
    config.basePoints,
    config.customPointsMultiplier,
    config.bonusPointsForPerfectScore,
    config.bonusPointsForSpeed,
    config.bonusPointsForFirstAttempt,
    onChange
  ]);

  const handleConfigChange = (key: keyof AchievementConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    toast({
      title: 'Reset to defaults',
      description: 'Achievement configuration has been reset to default values.',
    });
  };

  const getActivityTypePoints = (type: string): number => {
    const defaultPoints: Record<string, number> = {
      'multiple-choice': 20,
      'true-false': 15,
      'fill-in-the-blanks': 30,
      'matching': 35,
      'sequence': 35,
      'numeric': 30,
      'essay': 50,
      'quiz': 20,
      'reading': 10,
      'video': 15,
    };
    return defaultPoints[type] || 25;
  };

  // Set base points based on activity type
  useEffect(() => {
    const defaultPoints = getActivityTypePoints(activityType);
    if (config.basePoints === DEFAULT_CONFIG.basePoints) {
      handleConfigChange('basePoints', defaultPoints);
    }
  }, [activityType]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Achievement Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Customize points and achievements for this {activityType} activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Basic Settings
          </CardTitle>
          <CardDescription>
            Enable or disable achievement features for this activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Achievements</Label>
              <p className="text-sm text-muted-foreground">
                Students will earn achievements and points for completing this activity
              </p>
            </div>
            <Switch
              checked={config.enableAchievements}
              onCheckedChange={(checked) => handleConfigChange('enableAchievements', checked)}
            />
          </div>

          {config.enableAchievements && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Points Animation</Label>
                  <p className="text-sm text-muted-foreground">
                    Show animated points when students earn them
                  </p>
                </div>
                <Switch
                  checked={config.enablePointsAnimation}
                  onCheckedChange={(checked) => handleConfigChange('enablePointsAnimation', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Celebration Level</Label>
                <div className="flex gap-2">
                  {(['minimal', 'standard', 'enthusiastic'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={config.celebrationLevel === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleConfigChange('celebrationLevel', level)}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Points Configuration */}
      {config.enableAchievements && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Points Configuration
            </CardTitle>
            <CardDescription>
              Set the base points and bonus multipliers for this activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePoints">Base Points</Label>
                <Input
                  id="basePoints"
                  type="number"
                  min="1"
                  max="100"
                  value={config.basePoints}
                  onChange={(e) => handleConfigChange('basePoints', parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Points awarded for completing the activity
                </p>
              </div>

              <div className="space-y-2">
                <Label>Points Multiplier: {config.customPointsMultiplier}x</Label>
                <Slider
                  value={[config.customPointsMultiplier]}
                  onValueChange={([value]) => handleConfigChange('customPointsMultiplier', value)}
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Multiply base points by this factor
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perfectScoreBonus">Perfect Score Bonus</Label>
                <Input
                  id="perfectScoreBonus"
                  type="number"
                  min="0"
                  max="50"
                  value={config.bonusPointsForPerfectScore}
                  onChange={(e) => handleConfigChange('bonusPointsForPerfectScore', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speedBonus">Speed Bonus</Label>
                <Input
                  id="speedBonus"
                  type="number"
                  min="0"
                  max="20"
                  value={config.bonusPointsForSpeed}
                  onChange={(e) => handleConfigChange('bonusPointsForSpeed', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstAttemptBonus">First Attempt Bonus</Label>
                <Input
                  id="firstAttemptBonus"
                  type="number"
                  min="0"
                  max="20"
                  value={config.bonusPointsForFirstAttempt}
                  onChange={(e) => handleConfigChange('bonusPointsForFirstAttempt', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Triggers */}
      {config.enableAchievements && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Achievement Triggers
            </CardTitle>
            <CardDescription>
              Configure which achievements students can earn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Perfect Score</Label>
                  <p className="text-xs text-muted-foreground">100% correct answers</p>
                </div>
                <Switch
                  checked={config.enablePerfectScoreAchievement}
                  onCheckedChange={(checked) => handleConfigChange('enablePerfectScoreAchievement', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Speed Achievement</Label>
                  <p className="text-xs text-muted-foreground">Complete quickly</p>
                </div>
                <Switch
                  checked={config.enableSpeedAchievement}
                  onCheckedChange={(checked) => handleConfigChange('enableSpeedAchievement', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">First Attempt</Label>
                  <p className="text-xs text-muted-foreground">Success on first try</p>
                </div>
                <Switch
                  checked={config.enableFirstAttemptAchievement}
                  onCheckedChange={(checked) => handleConfigChange('enableFirstAttemptAchievement', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Improvement</Label>
                  <p className="text-xs text-muted-foreground">Better than last attempt</p>
                </div>
                <Switch
                  checked={config.enableImprovementAchievement}
                  onCheckedChange={(checked) => handleConfigChange('enableImprovementAchievement', checked)}
                />
              </div>
            </div>

            {config.enableSpeedAchievement && (
              <div className="space-y-2">
                <Label>Speed Bonus Threshold: {config.speedBonusThreshold} seconds</Label>
                <Slider
                  value={[config.speedBonusThreshold]}
                  onValueChange={([value]) => handleConfigChange('speedBonusThreshold', value)}
                  min={30}
                  max={300}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Students must complete within this time to earn speed bonus
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Points Preview */}
      {config.enableAchievements && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Points Preview
            </CardTitle>
            <CardDescription>
              Estimated points students can earn from this activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-muted-foreground">
                  {config.estimatedPoints.minimum}
                </div>
                <div className="text-sm text-muted-foreground">Minimum</div>
                <Badge variant="outline" className="mt-1">
                  Base completion
                </Badge>
              </div>

              <div className="text-center p-4 border rounded-lg bg-primary/5">
                <div className="text-2xl font-bold text-primary">
                  {config.estimatedPoints.average}
                </div>
                <div className="text-sm text-muted-foreground">Average</div>
                <Badge variant="secondary" className="mt-1">
                  Typical performance
                </Badge>
              </div>

              <div className="text-center p-4 border rounded-lg bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-600">
                  {config.estimatedPoints.maximum}
                </div>
                <div className="text-sm text-muted-foreground">Maximum</div>
                <Badge variant="default" className="mt-1 bg-yellow-500">
                  All bonuses
                </Badge>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Points Breakdown:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Base: {Math.floor(config.basePoints * config.customPointsMultiplier)} points</li>
                    {config.enablePerfectScoreAchievement && (
                      <li>• Perfect Score: +{config.bonusPointsForPerfectScore} points</li>
                    )}
                    {config.enableSpeedAchievement && (
                      <li>• Speed Bonus: +{config.bonusPointsForSpeed} points</li>
                    )}
                    {config.enableFirstAttemptAchievement && (
                      <li>• First Attempt: +{config.bonusPointsForFirstAttempt} points</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AchievementConfigEditor;
