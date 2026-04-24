-- Feature requests submitted by visitors
CREATE TABLE public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  author_name text CHECK (author_name IS NULL OR char_length(author_name) <= 60),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','planned','done','rejected')),
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feature_requests_status_idx ON public.feature_requests(status);
CREATE INDEX feature_requests_votes_idx ON public.feature_requests(vote_count DESC);

CREATE TRIGGER feature_requests_set_updated_at
BEFORE UPDATE ON public.feature_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feature requests are publicly readable"
ON public.feature_requests FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can submit a feature request"
ON public.feature_requests FOR INSERT TO public WITH CHECK (true);

-- One vote per anonymous client per request
CREATE TABLE public.feature_request_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  voter_key text NOT NULL CHECK (char_length(voter_key) BETWEEN 8 AND 128),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, voter_key)
);

CREATE INDEX feature_request_votes_request_idx ON public.feature_request_votes(request_id);

ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are publicly readable"
ON public.feature_request_votes FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can cast a vote"
ON public.feature_request_votes FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can withdraw their own vote"
ON public.feature_request_votes FOR DELETE TO public USING (true);

-- Keep vote_count in sync with rows in feature_request_votes
CREATE OR REPLACE FUNCTION public.sync_feature_request_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feature_requests
       SET vote_count = vote_count + 1,
           updated_at = now()
     WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feature_requests
       SET vote_count = GREATEST(vote_count - 1, 0),
           updated_at = now()
     WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER feature_request_votes_count_ins
AFTER INSERT ON public.feature_request_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_feature_request_vote_count();

CREATE TRIGGER feature_request_votes_count_del
AFTER DELETE ON public.feature_request_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_feature_request_vote_count();