WITH RECURSIVE delegations(
  "voteId", "toUserId", "byUserId",
  depth
) AS (
  SELECT
    "voteId",
    "toUserId",
    "byUserId",
    1
  FROM
    "VoteDelegations" vd
  WHERE
    vd."voteId" = 'cf279a31-5ada-488c-a898-5b6f5a34362c'
    AND vd."deletedAt" IS NULL
  UNION ALL
  SELECT
    vd."voteId",
    vd."toUserId",
    dc."byUserId",
    dc.depth + 1
  FROM
    delegations dc,
    "VoteDelegations" vd
  WHERE
    vd."byUserId" = dc."toUserId"
    AND vd."voteId" = dc."voteId"
    AND vd."deletedAt" IS NULL
),
indirect_delegations(
  "voteId", "toUserId", "byUserId",
  depth
) AS (
  SELECT
    DISTINCT ON("byUserId") "voteId",
    "toUserId",
    "byUserId",
    depth
  FROM
    delegations
  ORDER BY
    "byUserId",
    depth DESC
),
user_accounts ( --alternative accounts of the User. That is many users can have same UserConnection, but we consider them the same User in voting
    "userId", "connectionId", "connectionUserId"
) AS (
  SELECT
    uc."userId",
    uc."connectionId",
    uc."connectionUserId"
  FROM "UserConnections" uc
  ORDER BY uc."userId"
),
user_effective_after_checking_user_connections (
    "voteId", "userId"
) AS (
    SELECT
        vl."voteId",
        uco."userId" -- this is what says which userId is effective after checking for the connection chain.
    FROM
        "VoteLists" vl
        JOIN "UserConnections" ucs ON (ucs."userId" = vl."userId")
        JOIN "UserConnections" uco ON (uco."connectionId" = ucs."connectionId" AND uco."connectionUserId" = ucs."connectionUserId")
        JOIN "VoteLists" vlo ON (vlo."voteId" = vl."voteId" AND vlo."userId" = uco."userId")
    WHERE
        vl."voteId" = 'cf279a31-5ada-488c-a898-5b6f5a34362c'
    ORDER BY vlo."createdAt" DESC
),
vote_groups("voteId", "userId", "optionGroupId", "updatedAt") AS (
  SELECT DISTINCT ON ("userIdEffective")
    vl."voteId",
    (
       SELECT
            uco."userId" -- this is what says which userId is effective after checking for the connection chain
       FROM
            "VoteLists" vls
            JOIN "UserConnections" ucs ON (ucs."userId" = vls."userId")
            JOIN "UserConnections" uco ON (uco."connectionId" = ucs."connectionId" AND uco."connectionUserId" = ucs."connectionUserId")
            JOIN "VoteLists" vlo ON (vlo."voteId" = vls."voteId" AND vlo."userId" = uco."userId")
        WHERE vls."userId" = vl."userId"
        AND vls."voteId" = vl."voteId"
        AND vl."deletedAt" IS NULL
        AND vlo."deletedAt" IS NULL
        ORDER BY vlo."updatedAt" DESC
        LIMIT 1
    ) "userIdEffective", -- after all the UserConnection chain, this is the "userId" of the Vote counted
    vl."optionGroupId",
    vl."updatedAt"
  FROM
    "VoteLists" vl
  WHERE
    vl."voteId" = 'cf279a31-5ada-488c-a898-5b6f5a34362c'
    AND vl."deletedAt" IS NULL
  ORDER BY
    "userIdEffective",
    vl."optionGroupId",
    vl."updatedAt" DESC
),
votes(
  "voteId", "userId", "optionId", "optionGroupId"
) AS (
  SELECT
    vl."voteId",
    vl."userId",
    vl."optionId",
    vl."optionGroupId"
  FROM
    "VoteLists" vl
    JOIN vote_groups vg ON (
      vl."voteId" = vg."voteId"
      AND vl."optionGroupId" = vg."optionGroupId"
    )
  WHERE
    vl."voteId" = 'cf279a31-5ada-488c-a898-5b6f5a34362c'
),
votes_with_delegations(
  "voteId", "userId", "optionId", "optionGroupId",
  depth
) AS (
  SELECT
    v."voteId",
    v."userId",
    v."optionId",
    v."optionGroupId",
    id."depth"
  FROM
    votes v
    LEFT JOIN indirect_delegations id ON (v."userId" = id."toUserId")
  WHERE
    v."userId" NOT IN (
      SELECT
        "byUserId"
      FROM
        indirect_delegations
      WHERE
        "voteId" = v."voteId"
    )
)
SELECT * FROM vote_groups;

--SELECT
--  SUM(v."voteCount") as "voteCount",
--  v."optionId",
--  v."voteId",
--  vo."value",
--  (
--    SELECT
--      true
--    FROM
--      votes
--    WHERE
--      "userId" = '649948bd-dd2e-47af-b1f1-0e84af020c99'
--      AND "optionId" = v."optionId"
--  ) as "selected"
--FROM
--  (
--    SELECT
--      COUNT(v."optionId") + 1 as "voteCount",
--      v."optionId",
--      v."optionGroupId",
--      v."voteId"
--    FROM
--      votes_with_delegations v
--    WHERE
--      v.depth IS NOT NULL
--    GROUP BY
--      v."optionId",
--      v."optionGroupId",
--      v."voteId"
--    UNION ALL
--    SELECT
--      COUNT(v."optionId") as "voteCount",
--      v."optionId",
--      v."optionGroupId",
--      v."voteId"
--    FROM
--      votes_with_delegations v
--    WHERE
--      v.depth IS NULL
--    GROUP BY
--      v."optionId",
--      v."optionGroupId",
--      v."voteId"
--  ) v
--  LEFT JOIN "VoteOptions" vo ON (v."optionId" = vo."id")
--GROUP BY
--  v."optionId",
--  v."voteId",
--  vo."value";


--
--SELECT
--    vl."voteId",
--    vl."userId",
--    vl."optionGroupId",
--    uc."connectionId",
--    uc."connectionUserId",
--    uc."userId",
--    uc2."userId",
--    vl."updatedAt"
--FROM
--    "VoteLists" vl
--JOIN "UserConnections" uc ON (uc."userId" = vl."userId")
--JOIN "UserConnections" uc2 ON (uc2."userId" = uc."userId")
--WHERE
--    vl."voteId" = 'cf279a31-5ada-488c-a898-5b6f5a34362c'
--    AND vl."deletedAt" IS NULL
--ORDER BY
--    vl."voteId",
--    vl."userId",
--    vl."createdAt" DESC,
--    vl."optionGroupId" ASC
--;
--
--
-- Query that looks up all other Votes by same User connection and just leaves 1 user
--SELECT
--    ucs."userId",
--    uco."userId", -- this is what says which userId is effective after checking for the connection chain.
--    vl."optionGroupId",
--    vl."createdAt",
--    vlo."optionGroupId",
--    vlo."createdAt"
--FROM
--    "VoteLists" vl
--    JOIN "UserConnections" ucs ON (ucs."userId" = vl."userId")
--    JOIN "UserConnections" uco ON (uco."connectionId" = ucs."connectionId" AND uco."connectionUserId" = ucs."connectionUserId")
--    JOIN "VoteLists" vlo ON (vlo."voteId" = vl."voteId" AND vlo."userId" = uco."userId")
--WHERE
--    vl."userId" = 'da721d4a-4c84-4079-97bf-8799d98bd8b6'
--ORDER BY vlo."createdAt" DESC
--LIMIT 1;
--


--SELECT
--    uc."userId"
--FROM user_accounts uc
--WHERE  uc."connectionId" = 'esteid' AND uc."connectionUserId" = 'PNOEE-60001019906' AND uc."userId" != '144e52bb-f355-4631-af12-b2de52dc859e';
