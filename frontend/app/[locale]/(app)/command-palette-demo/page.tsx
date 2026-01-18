/**
 * page Page
 *
 * Route page component for /
 *
 * @fileoverview page page component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

/**
 * Command Palette Demo Page
 *
 * This page demonstrates and tests the command palette feature.
 * Access this page at: /command-palette-demo
 */

import { useState } from "react";
import { useCommandPaletteIntegration } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Keyboard, Star, Clock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function CommandPaletteDemoPage() {
  const { open, setOpen } = useCommandPaletteIntegration();
  const [testsPassed, setTestsPassed] = useState(0);

  const tests = [
    {
      id: 1,
      title: "Open Command Palette",
      description: "Press Cmd+K (Mac) or Ctrl+K (Windows)",
      action: () => setOpen(true),
      icon: Keyboard,
    },
    {
      id: 2,
      title: "Search for Dashboard",
      description: 'Type "dashboard" in the search',
      action: () => setOpen(true),
      icon: Search,
    },
    {
      id: 3,
      title: "Test Favorites",
      description: "Star a page by hovering and clicking ☆",
      action: () => setOpen(true),
      icon: Star,
    },
    {
      id: 4,
      title: "Check Recent Items",
      description: "Navigate to a page, then reopen palette",
      action: () => setOpen(true),
      icon: Clock,
    },
  ];

  const features = [
    {
      title: "Global Keyboard Shortcut",
      description: "Cmd+K (Mac) or Ctrl+K (Windows) opens the palette from anywhere",
      icon: Keyboard,
    },
    {
      title: "Fuzzy Search",
      description: 'Search by name, keywords, or module. Type "coa" to find "Chart of Accounts"',
      icon: Search,
    },
    {
      title: "Smart Navigation",
      description: "Use arrow keys to navigate, Enter to select, Esc to close",
      icon: ArrowRight,
    },
    {
      title: "Favorites System",
      description: "Star frequently used pages for quick access",
      icon: Star,
    },
    {
      title: "Recent Items",
      description: "Automatically tracks your 5 most recently visited pages",
      icon: Clock,
    },
    {
      title: "Persistent Preferences",
      description: "Favorites and recent items saved to localStorage",
      icon: CheckCircle2,
    },
  ];

  const searchExamples = [
    { query: "coa", result: "Chart of Accounts" },
    { query: "invoice", result: "Invoices" },
    { query: "vendor", result: "Vendors" },
    { query: "clients", result: "Customers (keyword match)" },
    { query: "accounting", result: "All Accounting module pages" },
    { query: "report", result: "Reports page" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Search className="h-12 w-12 text-zinc-600" />
          <h1 className="text-4xl font-bold">Command Palette Demo</h1>
        </div>
        <p className="text-lg text-zinc-600">
          Keyboard-driven navigation for the entire application
        </p>
        <Button size="lg" onClick={() => setOpen(true)} className="gap-2">
          <Keyboard className="h-5 w-5" />
          Try It Now
          <Badge variant="outline" className="ml-2">
            ⌘K
          </Badge>
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-zinc-600" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Search Examples</CardTitle>
          <CardDescription>Try typing these in the command palette</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {searchExamples.map((example) => (
              <div
                key={example.query}
                className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-1 text-xs font-mono rounded border bg-white dark:bg-zinc-800">
                    {example.query}
                  </kbd>
                  <ArrowRight className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm">{example.result}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Tests</CardTitle>
          <CardDescription>
            Follow these steps to verify the command palette works correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tests.map((test) => {
              const Icon = test.icon;
              return (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-zinc-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-zinc-600" />
                    <div>
                      <h4 className="font-medium">{test.title}</h4>
                      <p className="text-sm text-zinc-600">{test.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={test.action} className="gap-2">
                    Test
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Core Functionality</h4>
              <p className="text-sm text-zinc-600">
                Keyboard shortcuts, search, navigation, favorites, recent items - all working!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Platform Support</h4>
              <p className="text-sm text-zinc-600">
                Works on Mac (⌘K), Windows (Ctrl+K), and mobile devices
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Data Persistence</h4>
              <p className="text-sm text-zinc-600">
                Favorites and recent items saved to localStorage
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Page Implementation</h4>
              <p className="text-sm text-zinc-600">
                Some pages show "Coming Soon" - they're planned but not yet built
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Open/Close Palette</span>
                <Badge variant="outline">⌘K / Ctrl+K</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Navigate Up</span>
                <Badge variant="outline">↑</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Navigate Down</span>
                <Badge variant="outline">↓</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Select Item</span>
                <Badge variant="outline">Enter</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Close Palette</span>
                <Badge variant="outline">Esc</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Jump to First/Last</span>
                <Badge variant="outline">Home / End</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Tech Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>cmdk</Badge>
            <Badge>Radix UI</Badge>
            <Badge>Lucide React</Badge>
            <Badge>Next.js 16</Badge>
            <Badge>React 19</Badge>
            <Badge>TypeScript 5</Badge>
            <Badge>Tailwind CSS</Badge>
            <Badge>localStorage</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
