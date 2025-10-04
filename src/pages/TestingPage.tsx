import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LowStockTesting, LowStockTestResult } from "@/utils/lowStockTesting";
import { PlayCircle, CheckCircle2, XCircle, Clock, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function TestingPage() {
  const [testResults, setTestResults] = useState<LowStockTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const results = await LowStockTesting.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error("Test execution failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const totalTests = testResults.reduce((sum, r) => sum + r.results.length, 0);
  const passedTests = testResults.reduce(
    (sum, r) => sum + r.results.filter(t => t.success).length,
    0
  );
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Low Stock Module - Test Suite</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing for functionality, multi-tenancy, and performance
          </p>
        </div>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          size="lg"
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Activity className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {testResults.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
              <CardDescription>Overall test execution results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{totalTests}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{passedTests}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{totalTests - passedTests}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
                </div>
              </div>
              <Progress value={successRate} className="h-2" />
            </CardContent>
          </Card>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {testResults.map((testSuite, suiteIndex) => (
                <Card key={suiteIndex}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {testSuite.success ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                        <div>
                          <CardTitle>{testSuite.testName}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            {testSuite.totalDuration.toFixed(2)}ms
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={testSuite.success ? "default" : "destructive"}>
                        {testSuite.results.filter(r => r.success).length}/{testSuite.results.length} passed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testSuite.results.map((test, testIndex) => (
                        <div key={testIndex}>
                          {testIndex > 0 && <Separator className="my-3" />}
                          <div className="flex items-start gap-3">
                            {test.success ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{test.name}</p>
                                <span className="text-sm text-muted-foreground">
                                  {test.duration.toFixed(2)}ms
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{test.message}</p>
                              {test.details && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                    View details
                                  </summary>
                                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                    {JSON.stringify(test.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {testResults.length === 0 && !isRunning && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Tests Run Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Run All Tests" to start the test suite
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
