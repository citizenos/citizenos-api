--
-- PostgreSQL database dump
--

-- Dumped from database version 10.10 (Ubuntu 10.10-1.pgdg16.04+1)
-- Dumped by pg_dump version 10.10 (Ubuntu 10.10-1.pgdg16.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track execution statistics of all SQL statements executed';


--
-- Name: enum_Attachments_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Attachments_source" AS ENUM (
    'upload',
    'dropbox',
    'onedrive',
    'googledrive'
);


--
-- Name: enum_Comments_deletedReasonType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Comments_deletedReasonType" AS ENUM (
    'abuse',
    'obscene',
    'spam',
    'hate',
    'netiquette',
    'duplicate'
);


--
-- Name: enum_Comments_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Comments_type" AS ENUM (
    'pro',
    'con',
    'reply'
);


--
-- Name: enum_GroupMembers_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_GroupMembers_level" AS ENUM (
    'read',
    'admin'
);


--
-- Name: enum_Groups_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Groups_visibility" AS ENUM (
    'public',
    'private'
);


--
-- Name: enum_Reports_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Reports_type" AS ENUM (
    'abuse',
    'obscene',
    'spam',
    'hate',
    'netiquette',
    'duplicate'
);


--
-- Name: enum_TopicInviteUsers_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_TopicInviteUsers_level" AS ENUM (
    'none',
    'read',
    'edit',
    'admin'
);


--
-- Name: enum_TopicMemberGroups_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_TopicMemberGroups_level" AS ENUM (
    'none',
    'read',
    'edit',
    'admin'
);


--
-- Name: enum_TopicMemberUsers_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_TopicMemberUsers_level" AS ENUM (
    'none',
    'read',
    'edit',
    'admin'
);


--
-- Name: enum_TopicReports_moderatedReasonType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_TopicReports_moderatedReasonType" AS ENUM (
    'abuse',
    'obscene',
    'spam',
    'hate',
    'netiquette',
    'duplicate'
);


--
-- Name: enum_TopicReports_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_TopicReports_type" AS ENUM (
    'abuse',
    'obscene',
    'spam',
    'hate',
    'netiquette',
    'duplicate'
);


--
-- Name: enum_Topics_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Topics_status" AS ENUM (
    'inProgress',
    'voting',
    'followUp',
    'closed'
);


--
-- Name: enum_Topics_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Topics_visibility" AS ENUM (
    'public',
    'private'
);


--
-- Name: enum_UserConnections_connectionId; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_UserConnections_connectionId" AS ENUM (
    'esteid',
    'smartid',
    'google',
    'facebook',
    'citizenos'
);


--
-- Name: enum_Users_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Users_source" AS ENUM (
    'citizenos',
    'citizenosSystem',
    'google',
    'facebook'
);


--
-- Name: enum_Votes_authType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Votes_authType" AS ENUM (
    'soft',
    'hard'
);


--
-- Name: enum_Votes_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Votes_type" AS ENUM (
    'regular',
    'multiple'
);


--
-- Name: ueberdb_insert_or_update(character varying, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ueberdb_insert_or_update(character varying, text) RETURNS void
    LANGUAGE plpgsql
    AS $_$ BEGIN   IF EXISTS( SELECT * FROM store WHERE key = $1 ) THEN     UPDATE store SET value = $2 WHERE key = $1;   ELSE     INSERT INTO store(key,value) VALUES( $1, $2 );   END IF;   RETURN; END; $_$;


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Activities" (
    id uuid NOT NULL,
    data jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "actorType" text,
    "actorId" text,
    "topicIds" text[] DEFAULT ARRAY[]::text[],
    "groupIds" text[] DEFAULT ARRAY[]::text[],
    "userIds" text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: Attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attachments" (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    source public."enum_Attachments_source" NOT NULL,
    size bigint,
    link character varying(255) NOT NULL,
    "creatorId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: CommentReports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommentReports" (
    "commentId" uuid NOT NULL,
    "reportId" uuid NOT NULL
);


--
-- Name: CommentVotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommentVotes" (
    "commentId" uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    value integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: Comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Comments" (
    id uuid NOT NULL,
    type public."enum_Comments_type" NOT NULL,
    "parentId" uuid NOT NULL,
    subject character varying(128),
    text character varying(2048) NOT NULL,
    "creatorId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "deletedById" uuid,
    "deletedReasonType" public."enum_Comments_deletedReasonType",
    "deletedReasonText" character varying(2048),
    "deletedByReportId" uuid,
    edits jsonb,
    "parentVersion" bigint DEFAULT 0 NOT NULL
);


--
-- Name: GroupMembers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroupMembers" (
    "groupId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    level public."enum_GroupMembers_level" DEFAULT 'read'::public."enum_GroupMembers_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: Groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Groups" (
    id uuid NOT NULL,
    "parentId" uuid,
    name character varying(255) NOT NULL,
    "creatorId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    visibility public."enum_Groups_visibility" DEFAULT 'private'::public."enum_Groups_visibility" NOT NULL,
    "sourcePartnerId" uuid
);


--
-- Name: Moderators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Moderators" (
    "userId" uuid NOT NULL,
    "partnerId" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    id uuid DEFAULT (md5(((random())::text || (clock_timestamp())::text)))::uuid NOT NULL
);


--
-- Name: Partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Partners" (
    id uuid NOT NULL,
    website character varying(255) NOT NULL,
    "redirectUriRegexp" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "linkPrivacyPolicy" text
);


--
-- Name: Reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reports" (
    id uuid NOT NULL,
    type public."enum_Reports_type" NOT NULL,
    text character varying(2048),
    "creatorId" uuid NOT NULL,
    "creatorIp" character varying(45) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: TopicAttachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicAttachments" (
    "topicId" uuid NOT NULL,
    "attachmentId" uuid NOT NULL
);


--
-- Name: TopicComments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicComments" (
    "topicId" uuid NOT NULL,
    "commentId" uuid NOT NULL
);


--
-- Name: TopicEvents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicEvents" (
    id uuid NOT NULL,
    "topicId" uuid NOT NULL,
    subject character varying(128),
    text text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: TopicInviteUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicInviteUsers" (
    id uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "topicId" uuid NOT NULL,
    level public."enum_TopicInviteUsers_level" DEFAULT 'read'::public."enum_TopicInviteUsers_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "TopicInviteUsers"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers"."creatorId" IS 'User who created the invite.';


--
-- Name: COLUMN "TopicInviteUsers"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers"."userId" IS 'User who is invited.';


--
-- Name: COLUMN "TopicInviteUsers"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers"."topicId" IS 'Topic to which member belongs.';


--
-- Name: COLUMN "TopicInviteUsers".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers".level IS 'User membership level.';


--
-- Name: TopicMemberGroups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicMemberGroups" (
    "groupId" uuid NOT NULL,
    "topicId" uuid NOT NULL,
    level public."enum_TopicMemberGroups_level" DEFAULT 'read'::public."enum_TopicMemberGroups_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: TopicMemberUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicMemberUsers" (
    "userId" uuid NOT NULL,
    "topicId" uuid NOT NULL,
    level public."enum_TopicMemberUsers_level" DEFAULT 'read'::public."enum_TopicMemberUsers_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: TopicPins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicPins" (
    "topicId" uuid NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: TopicReports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicReports" (
    id uuid NOT NULL,
    type public."enum_TopicReports_type" NOT NULL,
    text character varying(2048) NOT NULL,
    "creatorId" uuid NOT NULL,
    "creatorIp" character varying(45) NOT NULL,
    "topicId" uuid NOT NULL,
    "moderatedById" uuid,
    "moderatedAt" timestamp with time zone,
    "moderatedReasonType" public."enum_TopicReports_moderatedReasonType",
    "moderatedReasonText" character varying(2048),
    "resolvedById" uuid,
    "resolvedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "TopicReports".type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports".type IS 'Report reason - verbal abuse, obscene content, hate speech etc..';


--
-- Name: COLUMN "TopicReports".text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports".text IS 'Additional comment for the report to provide more details on the violation.';


--
-- Name: COLUMN "TopicReports"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."creatorId" IS 'User ID of the reporter.';


--
-- Name: COLUMN "TopicReports"."creatorIp"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."creatorIp" IS 'IP address of the reporter';


--
-- Name: COLUMN "TopicReports"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."topicId" IS 'Id if the Topic which the Report belongs to.';


--
-- Name: COLUMN "TopicReports"."moderatedById"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."moderatedById" IS 'User ID of the person who moderated the Topic on report. That is, a Moderator agreed that Report is valid.';


--
-- Name: COLUMN "TopicReports"."moderatedAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."moderatedAt" IS 'Time when the Topic was Moderated';


--
-- Name: COLUMN "TopicReports"."moderatedReasonType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."moderatedReasonType" IS 'Moderation reason - verbal abuse, obscene content, hate speech etc..';


--
-- Name: COLUMN "TopicReports"."moderatedReasonText"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."moderatedReasonText" IS 'Additional comment for the Report to provide more details on the Moderator acton.';


--
-- Name: COLUMN "TopicReports"."resolvedById"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."resolvedById" IS 'User ID of the person who considered the issue to be resolved thus making the report outdated.';


--
-- Name: COLUMN "TopicReports"."resolvedAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicReports"."resolvedAt" IS 'Time when the Report was marked as resolved.';


--
-- Name: TopicVotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicVotes" (
    "topicId" uuid NOT NULL,
    "voteId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: Topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Topics" (
    id uuid NOT NULL,
    title character varying(1000),
    description text,
    status public."enum_Topics_status" DEFAULT 'inProgress'::public."enum_Topics_status" NOT NULL,
    visibility public."enum_Topics_visibility" DEFAULT 'private'::public."enum_Topics_visibility" NOT NULL,
    "creatorId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    categories character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "tokenJoin" character varying(8) NOT NULL,
    "padUrl" character varying(255) NOT NULL,
    "endsAt" timestamp with time zone,
    "sourcePartnerId" uuid,
    hashtag character varying(60) DEFAULT NULL::character varying,
    "sourcePartnerObjectId" character varying(255)
);


--
-- Name: UserConnections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserConnections" (
    "userId" uuid NOT NULL,
    "connectionId" public."enum_UserConnections_connectionId" NOT NULL,
    "connectionUserId" character varying(255) NOT NULL,
    "connectionData" json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: UserConsents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserConsents" (
    "userId" uuid NOT NULL,
    "partnerId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: Users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users" (
    id uuid NOT NULL,
    name character varying(255),
    company character varying(255),
    email character varying(254),
    password character varying(64),
    "passwordResetCode" uuid,
    "emailIsVerified" boolean DEFAULT false NOT NULL,
    "emailVerificationCode" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    language character varying(5) DEFAULT 'en'::character varying,
    source public."enum_Users_source" NOT NULL,
    "sourceId" character varying(255),
    "imageUrl" character varying(255),
    "termsVersion" character varying(255),
    "termsAcceptedAt" timestamp with time zone
);


--
-- Name: COLUMN "Users"."termsVersion"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."termsVersion" IS 'Version identifier of user terms accepted by user';


--
-- Name: COLUMN "Users"."termsAcceptedAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."termsAcceptedAt" IS 'Time when the terms were accepted';


--
-- Name: VoteContainerFiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteContainerFiles" (
    id uuid NOT NULL,
    "voteId" uuid NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "mimeType" character varying(255) NOT NULL,
    content bytea NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: VoteDelegations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteDelegations" (
    id integer NOT NULL,
    "voteId" uuid NOT NULL,
    "toUserId" uuid NOT NULL,
    "byUserId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: VoteDelegations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."VoteDelegations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: VoteDelegations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."VoteDelegations_id_seq" OWNED BY public."VoteDelegations".id;


--
-- Name: VoteLists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteLists" (
    id integer NOT NULL,
    "voteId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "optionId" uuid NOT NULL,
    "optionGroupId" character varying(8) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: VoteLists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."VoteLists_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: VoteLists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."VoteLists_id_seq" OWNED BY public."VoteLists".id;


--
-- Name: VoteOptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteOptions" (
    id uuid NOT NULL,
    "voteId" uuid NOT NULL,
    value character varying(100) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: VoteUserContainers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteUserContainers" (
    "userId" uuid NOT NULL,
    "voteId" uuid NOT NULL,
    container bytea NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: Votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Votes" (
    id uuid NOT NULL,
    "minChoices" integer DEFAULT 1 NOT NULL,
    "maxChoices" integer DEFAULT 1 NOT NULL,
    "delegationIsAllowed" boolean DEFAULT false NOT NULL,
    "endsAt" timestamp with time zone,
    description character varying(255) DEFAULT NULL::character varying,
    type public."enum_Votes_type" DEFAULT 'regular'::public."enum_Votes_type" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "authType" public."enum_Votes_authType" DEFAULT 'soft'::public."enum_Votes_authType" NOT NULL
);


--
-- Name: store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store (
    key character varying(100) NOT NULL,
    value text NOT NULL
);


--
-- Name: VoteDelegations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteDelegations" ALTER COLUMN id SET DEFAULT nextval('public."VoteDelegations_id_seq"'::regclass);


--
-- Name: VoteLists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteLists" ALTER COLUMN id SET DEFAULT nextval('public."VoteLists_id_seq"'::regclass);


--
-- Name: Activities Activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activities"
    ADD CONSTRAINT "Activities_pkey" PRIMARY KEY (id);


--
-- Name: Attachments Attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachments"
    ADD CONSTRAINT "Attachments_pkey" PRIMARY KEY (id);


--
-- Name: CommentReports CommentReports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentReports"
    ADD CONSTRAINT "CommentReports_pkey" PRIMARY KEY ("commentId", "reportId");


--
-- Name: CommentVotes CommentVotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentVotes"
    ADD CONSTRAINT "CommentVotes_pkey" PRIMARY KEY ("commentId", "creatorId");


--
-- Name: Comments Comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_pkey" PRIMARY KEY (id);


--
-- Name: GroupMembers GroupMembers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupMembers"
    ADD CONSTRAINT "GroupMembers_pkey" PRIMARY KEY ("groupId", "userId");


--
-- Name: Groups Groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: Moderators Moderators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Moderators"
    ADD CONSTRAINT "Moderators_pkey" PRIMARY KEY (id);


--
-- Name: Partners Partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Partners"
    ADD CONSTRAINT "Partners_pkey" PRIMARY KEY (id);


--
-- Name: Reports Reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reports"
    ADD CONSTRAINT "Reports_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: TopicAttachments TopicAttachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicAttachments"
    ADD CONSTRAINT "TopicAttachments_pkey" PRIMARY KEY ("topicId", "attachmentId");


--
-- Name: TopicComments TopicComments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicComments"
    ADD CONSTRAINT "TopicComments_pkey" PRIMARY KEY ("topicId", "commentId");


--
-- Name: TopicEvents TopicEvents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicEvents"
    ADD CONSTRAINT "TopicEvents_pkey" PRIMARY KEY (id);


--
-- Name: TopicPins TopicFavourites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicPins"
    ADD CONSTRAINT "TopicFavourites_pkey" PRIMARY KEY ("topicId", "userId");


--
-- Name: TopicInviteUsers TopicInviteUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_pkey" PRIMARY KEY (id, "topicId");


--
-- Name: TopicMemberGroups TopicMemberGroups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicMemberGroups"
    ADD CONSTRAINT "TopicMemberGroups_pkey" PRIMARY KEY ("groupId", "topicId");


--
-- Name: TopicMemberUsers TopicMemberUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicMemberUsers"
    ADD CONSTRAINT "TopicMemberUsers_pkey" PRIMARY KEY ("userId", "topicId");


--
-- Name: TopicReports TopicReports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicReports"
    ADD CONSTRAINT "TopicReports_pkey" PRIMARY KEY (id, "topicId");


--
-- Name: TopicVotes TopicVotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicVotes"
    ADD CONSTRAINT "TopicVotes_pkey" PRIMARY KEY ("topicId", "voteId");


--
-- Name: Topics Topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_pkey" PRIMARY KEY (id);


--
-- Name: Topics Topics_tokenJoin_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_tokenJoin_key" UNIQUE ("tokenJoin");


--
-- Name: UserConnections UserConnections_connectionId_connectionUserId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConnections"
    ADD CONSTRAINT "UserConnections_connectionId_connectionUserId_key" UNIQUE ("connectionId", "connectionUserId");


--
-- Name: UserConnections UserConnections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConnections"
    ADD CONSTRAINT "UserConnections_pkey" PRIMARY KEY ("userId", "connectionId");


--
-- Name: UserConsents UserConsents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConsents"
    ADD CONSTRAINT "UserConsents_pkey" PRIMARY KEY ("userId", "partnerId");


--
-- Name: Users Users_emailVerificationCode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_emailVerificationCode_key" UNIQUE ("emailVerificationCode");


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: VoteContainerFiles VoteContainerFiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteContainerFiles"
    ADD CONSTRAINT "VoteContainerFiles_pkey" PRIMARY KEY (id);


--
-- Name: VoteDelegations VoteDelegations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteDelegations"
    ADD CONSTRAINT "VoteDelegations_pkey" PRIMARY KEY (id);


--
-- Name: VoteDelegations VoteDelegations_voteId_byUserId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteDelegations"
    ADD CONSTRAINT "VoteDelegations_voteId_byUserId_key" UNIQUE ("voteId", "byUserId");


--
-- Name: VoteLists VoteLists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteLists"
    ADD CONSTRAINT "VoteLists_pkey" PRIMARY KEY (id);


--
-- Name: VoteOptions VoteOptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteOptions"
    ADD CONSTRAINT "VoteOptions_pkey" PRIMARY KEY (id);


--
-- Name: VoteUserContainers VoteUserContainers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteUserContainers"
    ADD CONSTRAINT "VoteUserContainers_pkey" PRIMARY KEY ("userId", "voteId");


--
-- Name: Votes Votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Votes"
    ADD CONSTRAINT "Votes_pkey" PRIMARY KEY (id);


--
-- Name: store store_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_pkey PRIMARY KEY (key);


--
-- Name: activities_actor_type_actor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_actor_type_actor_id ON public."Activities" USING btree ("actorType", "actorId");


--
-- Name: activities_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_data ON public."Activities" USING gin (data jsonb_path_ops);


--
-- Name: activities_group_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_group_ids ON public."Activities" USING gin ("groupIds");


--
-- Name: activities_topic_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_topic_ids ON public."Activities" USING gin ("topicIds");


--
-- Name: activities_user_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_user_ids ON public."Activities" USING gin ("userIds");


--
-- Name: moderators_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX moderators_user_id ON public."Moderators" USING btree ("userId") WHERE ("partnerId" IS NULL);


--
-- Name: moderators_user_id_partner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX moderators_user_id_partner_id ON public."Moderators" USING btree ("userId", "partnerId") WHERE ("partnerId" IS NOT NULL);


--
-- Name: topic_member_groups_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topic_member_groups_group_id ON public."TopicMemberGroups" USING btree ("groupId");


--
-- Name: topic_member_groups_topic_id_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topic_member_groups_topic_id_group_id ON public."TopicMemberGroups" USING btree ("topicId", "groupId");


--
-- Name: topic_member_users_topic_id_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topic_member_users_topic_id_user_id ON public."TopicMemberUsers" USING btree ("topicId", "userId");


--
-- Name: topic_votes_topic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topic_votes_topic_id ON public."TopicVotes" USING btree ("topicId");


--
-- Name: topics_source_partner_id_source_partner_object_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX topics_source_partner_id_source_partner_object_id ON public."Topics" USING btree ("sourcePartnerId", "sourcePartnerObjectId");


--
-- Name: topics_title_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX topics_title_deleted_at ON public."Topics" USING btree (title, "deletedAt") WHERE ((title IS NOT NULL) AND ("deletedAt" IS NULL));


--
-- Name: vote_lists_vote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vote_lists_vote_id ON public."VoteLists" USING btree ("voteId");


--
-- Name: vote_lists_vote_id_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vote_lists_vote_id_deleted_at ON public."VoteLists" USING btree ("voteId", "deletedAt");


--
-- Name: Attachments Attachments_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attachments"
    ADD CONSTRAINT "Attachments_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentReports CommentReports_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentReports"
    ADD CONSTRAINT "CommentReports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."Comments"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentReports CommentReports_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentReports"
    ADD CONSTRAINT "CommentReports_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."Reports"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentVotes CommentVotes_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentVotes"
    ADD CONSTRAINT "CommentVotes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."Comments"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentVotes CommentVotes_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentVotes"
    ADD CONSTRAINT "CommentVotes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comments Comments_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comments Comments_deletedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comments Comments_deletedByReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_deletedByReportId_fkey" FOREIGN KEY ("deletedByReportId") REFERENCES public."Reports"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comments Comments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comments"
    ADD CONSTRAINT "Comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Comments"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupMembers GroupMembers_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupMembers"
    ADD CONSTRAINT "GroupMembers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupMembers GroupMembers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupMembers"
    ADD CONSTRAINT "GroupMembers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Groups Groups_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Groups"
    ADD CONSTRAINT "Groups_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Groups Groups_sourcePartnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Groups"
    ADD CONSTRAINT "Groups_sourcePartnerId_fkey" FOREIGN KEY ("sourcePartnerId") REFERENCES public."Partners"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Moderators Moderators_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Moderators"
    ADD CONSTRAINT "Moderators_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partners"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Moderators Moderators_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Moderators"
    ADD CONSTRAINT "Moderators_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reports Reports_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reports"
    ADD CONSTRAINT "Reports_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicAttachments TopicAttachments_attachmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicAttachments"
    ADD CONSTRAINT "TopicAttachments_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES public."Attachments"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicAttachments TopicAttachments_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicAttachments"
    ADD CONSTRAINT "TopicAttachments_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicComments TopicComments_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicComments"
    ADD CONSTRAINT "TopicComments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."Comments"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicComments TopicComments_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicComments"
    ADD CONSTRAINT "TopicComments_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicEvents TopicEvents_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicEvents"
    ADD CONSTRAINT "TopicEvents_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicPins TopicFavourites_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicPins"
    ADD CONSTRAINT "TopicFavourites_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id);


--
-- Name: TopicPins TopicFavourites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicPins"
    ADD CONSTRAINT "TopicFavourites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id);


--
-- Name: TopicInviteUsers TopicInviteUsers_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id);


--
-- Name: TopicInviteUsers TopicInviteUsers_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id);


--
-- Name: TopicInviteUsers TopicInviteUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id);


--
-- Name: TopicMemberGroups TopicMemberGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicMemberGroups"
    ADD CONSTRAINT "TopicMemberGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicMemberGroups TopicMemberGroups_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicMemberGroups"
    ADD CONSTRAINT "TopicMemberGroups_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicMemberUsers TopicMemberUsers_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicMemberUsers"
    ADD CONSTRAINT "TopicMemberUsers_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicMemberUsers TopicMemberUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicMemberUsers"
    ADD CONSTRAINT "TopicMemberUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicReports TopicReports_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicReports"
    ADD CONSTRAINT "TopicReports_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicReports TopicReports_moderatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicReports"
    ADD CONSTRAINT "TopicReports_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicReports TopicReports_resolvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicReports"
    ADD CONSTRAINT "TopicReports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicReports TopicReports_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicReports"
    ADD CONSTRAINT "TopicReports_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id);


--
-- Name: TopicVotes TopicVotes_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicVotes"
    ADD CONSTRAINT "TopicVotes_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicVotes TopicVotes_voteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicVotes"
    ADD CONSTRAINT "TopicVotes_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES public."Votes"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Topics Topics_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Topics Topics_sourcePartnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_sourcePartnerId_fkey" FOREIGN KEY ("sourcePartnerId") REFERENCES public."Partners"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserConnections UserConnections_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConnections"
    ADD CONSTRAINT "UserConnections_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserConsents UserConsents_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConsents"
    ADD CONSTRAINT "UserConsents_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partners"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserConsents UserConsents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserConsents"
    ADD CONSTRAINT "UserConsents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteContainerFiles VoteContainerFiles_voteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteContainerFiles"
    ADD CONSTRAINT "VoteContainerFiles_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES public."Votes"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteDelegations VoteDelegations_byUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteDelegations"
    ADD CONSTRAINT "VoteDelegations_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteDelegations VoteDelegations_toUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteDelegations"
    ADD CONSTRAINT "VoteDelegations_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteDelegations VoteDelegations_voteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteDelegations"
    ADD CONSTRAINT "VoteDelegations_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES public."Votes"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteLists VoteLists_optionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteLists"
    ADD CONSTRAINT "VoteLists_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES public."VoteOptions"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteLists VoteLists_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteLists"
    ADD CONSTRAINT "VoteLists_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteLists VoteLists_voteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteLists"
    ADD CONSTRAINT "VoteLists_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES public."Votes"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteOptions VoteOptions_voteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteOptions"
    ADD CONSTRAINT "VoteOptions_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES public."Votes"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteUserContainers VoteUserContainers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteUserContainers"
    ADD CONSTRAINT "VoteUserContainers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoteUserContainers VoteUserContainers_voteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoteUserContainers"
    ADD CONSTRAINT "VoteUserContainers_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES public."Votes"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

COPY public."SequelizeMeta" (name) FROM stdin;
20181213213857-create-topic-favourite.js
20190131123024-alter-topic-title-limit.js
20190529193321-topic-report.js
20190627132611-alter-partner-terms-link.js
20190616115724-alter-user-accpet-terms.js
20191119124917-create-topic-invite-user.js
\.
