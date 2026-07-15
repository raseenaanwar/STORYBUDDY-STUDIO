/**
 * useStorySync
 * Polls GET /api/get-story every 2 seconds and returns
 * { html, tasks, advice, loading, error }.
 */
import { useState, useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 2000;

export function useStorySync() {
  const [html, setHtml] = useState("");
  const [tasks, setTasks] = useState([]);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);

  async function fetchStory() {
    try {
      const res = await fetch("/api/get-story");
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setHtml(data.html ?? "");
      setTasks(data.tasks ?? []);
      setAdvice(data.advice ?? "");
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch immediately on mount
    fetchStory();

    // Then poll on interval
    intervalRef.current = setInterval(fetchStory, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, []);

  return { html, tasks, advice, loading, error };
}
