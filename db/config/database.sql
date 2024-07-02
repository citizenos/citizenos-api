--
-- PostgreSQL database dump
--

-- Dumped from database version 14.12 (Ubuntu 14.12-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.12 (Ubuntu 14.12-0ubuntu0.22.04.1)

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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
    'poi',
    'reply'
);


--
-- Name: enum_GroupInviteUsers_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_GroupInviteUsers_level" AS ENUM (
    'read',
    'admin'
);


--
-- Name: enum_GroupJoins_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_GroupJoins_level" AS ENUM (
    'read',
    'admin'
);


--
-- Name: enum_GroupMemberUsers_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_GroupMemberUsers_level" AS ENUM (
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
-- Name: enum_IdeaReports_moderatedReasonType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_IdeaReports_moderatedReasonType" AS ENUM (
    'abuse',
    'obscene',
    'spam',
    'hate',
    'netiquette',
    'duplicate'
);


--
-- Name: enum_IdeaReports_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_IdeaReports_type" AS ENUM (
    'abuse',
    'obscene',
    'spam',
    'hate',
    'netiquette',
    'duplicate'
);


--
-- Name: enum_Ideas_deletedReasonType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Ideas_deletedReasonType" AS ENUM (
    'abuse',
    'obscene',
    'spam',
    'hate',
    'netiquette',
    'duplicate'
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
-- Name: enum_Requests_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Requests_level" AS ENUM (
    'none',
    'read',
    'edit',
    'admin'
);


--
-- Name: enum_Requests_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_Requests_type" AS ENUM (
    'addTopicGroup',
    'addGroupTopic',
    'userTopic',
    'userGroup'
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
-- Name: enum_TopicJoins_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_TopicJoins_level" AS ENUM (
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
    'draft',
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Activities" (
    id uuid NOT NULL,
    data jsonb NOT NULL,
    "actorType" text,
    "actorId" text,
    "topicIds" text[] DEFAULT ARRAY[]::text[],
    "groupIds" text[] DEFAULT ARRAY[]::text[],
    "userIds" text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Activities".id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Activities".id IS 'Id of the Activity';


--
-- Name: COLUMN "Activities".data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Activities".data IS 'Activity content';


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
-- Name: COLUMN "Attachments".name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attachments".name IS 'file name to display';


--
-- Name: COLUMN "Attachments".type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attachments".type IS 'Files type';


--
-- Name: COLUMN "Attachments".size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attachments".size IS 'file size in bytes';


--
-- Name: COLUMN "Attachments".link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attachments".link IS 'files location';


--
-- Name: COLUMN "Attachments"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attachments"."creatorId" IS 'User ID of the reporter.';


--
-- Name: CommentReports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommentReports" (
    "commentId" uuid NOT NULL,
    "reportId" uuid NOT NULL
);


--
-- Name: COLUMN "CommentReports"."commentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CommentReports"."commentId" IS 'To what Comment the Report belongs to';


--
-- Name: COLUMN "CommentReports"."reportId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CommentReports"."reportId" IS 'Which Report belongs to the Comment';


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
-- Name: COLUMN "CommentVotes"."commentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CommentVotes"."commentId" IS 'Comment ID';


--
-- Name: COLUMN "CommentVotes"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CommentVotes"."creatorId" IS 'User ID of the creator of the Topic.';


--
-- Name: COLUMN "CommentVotes".value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CommentVotes".value IS 'Vote value. Numeric, can be negative on down-vote.';


--
-- Name: Comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Comments" (
    id uuid NOT NULL,
    type public."enum_Comments_type" NOT NULL,
    "parentId" uuid NOT NULL,
    "parentVersion" bigint DEFAULT 0 NOT NULL,
    subject character varying(128),
    text character varying(2048) NOT NULL,
    "creatorId" uuid NOT NULL,
    "deletedById" uuid,
    "deletedReasonType" public."enum_Comments_deletedReasonType",
    "deletedReasonText" character varying(2048),
    "deletedByReportId" uuid,
    edits jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Comments"."parentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments"."parentId" IS 'Parent comment id. Replies to comments have a parent.';


--
-- Name: COLUMN "Comments"."parentVersion"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments"."parentVersion" IS 'Edit version';


--
-- Name: COLUMN "Comments"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments"."creatorId" IS 'User ID of the creator of the Topic.';


--
-- Name: COLUMN "Comments"."deletedById"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments"."deletedById" IS 'User ID of the person who deleted the Comment';


--
-- Name: COLUMN "Comments"."deletedReasonType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments"."deletedReasonType" IS 'Delete reason type which is provided in case deleted by moderator due to a user report';


--
-- Name: COLUMN "Comments"."deletedReasonText"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments"."deletedReasonText" IS 'Free text with reason why the comment was deleted';


--
-- Name: COLUMN "Comments"."deletedByReportId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments"."deletedByReportId" IS 'Report ID due to which comment was deleted';


--
-- Name: COLUMN "Comments".edits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Comments".edits IS 'Comment versions in JSONB array';


--
-- Name: DiscussionComments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DiscussionComments" (
    "discussionId" uuid NOT NULL,
    "commentId" uuid NOT NULL
);


--
-- Name: COLUMN "DiscussionComments"."discussionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."DiscussionComments"."discussionId" IS 'To what Discussion this Comment belongs to.';


--
-- Name: COLUMN "DiscussionComments"."commentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."DiscussionComments"."commentId" IS 'Which Comment belongs to this Discussion.';


--
-- Name: Discussions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Discussions" (
    id uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    question character varying(2048),
    deadline timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Discussions"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Discussions"."creatorId" IS 'User who created the discussion.';


--
-- Name: COLUMN "Discussions".question; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Discussions".question IS 'Question the discussion is about';


--
-- Name: COLUMN "Discussions".deadline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Discussions".deadline IS 'Deadline for the discussion. If NULL then no deadline at all.';


--
-- Name: FolderIdeas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FolderIdeas" (
    "folderId" uuid NOT NULL,
    "ideaId" uuid NOT NULL
);


--
-- Name: COLUMN "FolderIdeas"."folderId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."FolderIdeas"."folderId" IS 'Folder where idea belongs';


--
-- Name: Folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Folders" (
    id uuid NOT NULL,
    "ideationId" uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    name character varying(512) NOT NULL,
    description character varying(2048),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Folders"."ideationId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Folders"."ideationId" IS 'To what ideation the folder belongs to';


--
-- Name: COLUMN "Folders"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Folders"."creatorId" IS 'User ID who created the folder';


--
-- Name: COLUMN "Folders".name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Folders".name IS 'Folder name';


--
-- Name: COLUMN "Folders".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Folders".description IS 'Folder description';


--
-- Name: GroupFavourites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroupFavourites" (
    "groupId" uuid NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: COLUMN "GroupFavourites"."groupId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupFavourites"."groupId" IS 'To what Group this row belongs to.';


--
-- Name: COLUMN "GroupFavourites"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupFavourites"."userId" IS 'Which User this row belongs to.';


--
-- Name: GroupInviteUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroupInviteUsers" (
    "userId" uuid NOT NULL,
    id uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    "expiresAt" timestamp with time zone,
    "groupId" uuid NOT NULL,
    level public."enum_GroupInviteUsers_level" DEFAULT 'read'::public."enum_GroupInviteUsers_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "GroupInviteUsers"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupInviteUsers"."userId" IS 'User who is invited.';


--
-- Name: COLUMN "GroupInviteUsers"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupInviteUsers"."creatorId" IS 'User who created the invite.';


--
-- Name: COLUMN "GroupInviteUsers"."expiresAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupInviteUsers"."expiresAt" IS 'Invite expiration time.';


--
-- Name: COLUMN "GroupInviteUsers"."groupId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupInviteUsers"."groupId" IS 'Group to which member belongs.';


--
-- Name: COLUMN "GroupInviteUsers".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupInviteUsers".level IS 'User membership level.';


--
-- Name: GroupJoins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroupJoins" (
    "groupId" uuid NOT NULL,
    token character varying(12) NOT NULL,
    level public."enum_GroupJoins_level" DEFAULT 'read'::public."enum_GroupJoins_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "GroupJoins"."groupId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupJoins"."groupId" IS 'Group to which the Join information belongs.';


--
-- Name: COLUMN "GroupJoins".token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupJoins".token IS 'Token for joining the Group. Used for sharing public urls for Users to join the Group.';


--
-- Name: COLUMN "GroupJoins".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupJoins".level IS 'Join level, that is what level access will the join token provide';


--
-- Name: GroupMemberUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroupMemberUsers" (
    "userId" uuid NOT NULL,
    "groupId" uuid NOT NULL,
    level public."enum_GroupMemberUsers_level" DEFAULT 'read'::public."enum_GroupMemberUsers_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "GroupMemberUsers"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupMemberUsers"."userId" IS 'User id';


--
-- Name: COLUMN "GroupMemberUsers"."groupId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupMemberUsers"."groupId" IS 'Group to which member belongs.';


--
-- Name: COLUMN "GroupMemberUsers".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."GroupMemberUsers".level IS 'User membership level.';


--
-- Name: Groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Groups" (
    id uuid NOT NULL,
    "parentId" uuid,
    name character varying(255) NOT NULL,
    "creatorId" uuid NOT NULL,
    visibility public."enum_Groups_visibility" DEFAULT 'private'::public."enum_Groups_visibility" NOT NULL,
    "sourcePartnerId" uuid,
    "imageUrl" character varying(255),
    country character varying(255),
    language character varying(255),
    rules character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    contact character varying(255),
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Groups"."parentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups"."parentId" IS 'Parent Groups id.';


--
-- Name: COLUMN "Groups".name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups".name IS 'Name of the Group.';


--
-- Name: COLUMN "Groups"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups"."creatorId" IS 'User ID of the creator of the Group.';


--
-- Name: COLUMN "Groups".visibility; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups".visibility IS 'Who can see (read) the Group apart from the Members.';


--
-- Name: COLUMN "Groups"."sourcePartnerId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups"."sourcePartnerId" IS 'The Partner id of the site from which the Group was created';


--
-- Name: COLUMN "Groups"."imageUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups"."imageUrl" IS 'Group profile image url.';


--
-- Name: COLUMN "Groups".country; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups".country IS 'Group location country';


--
-- Name: COLUMN "Groups".language; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups".language IS 'Group language';


--
-- Name: COLUMN "Groups".rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups".rules IS 'Group rules';


--
-- Name: COLUMN "Groups".contact; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups".contact IS 'Group contact info';


--
-- Name: COLUMN "Groups".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Groups".description IS 'Short description of what the Group is about.';


--
-- Name: IdeaComments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IdeaComments" (
    "ideaId" uuid NOT NULL,
    "commentId" uuid NOT NULL
);


--
-- Name: COLUMN "IdeaComments"."ideaId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."IdeaComments"."ideaId" IS 'To what Idea this Comment belongs to.';


--
-- Name: COLUMN "IdeaComments"."commentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."IdeaComments"."commentId" IS 'Which Comment belongs to this Idea.';


--
-- Name: IdeaFavourites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IdeaFavourites" (
    "ideaId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "IdeaFavourites"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."IdeaFavourites"."userId" IS 'User ID who favourited the idea';


--
-- Name: IdeaReports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IdeaReports" (
    "ideaId" uuid NOT NULL,
    "reportId" uuid NOT NULL,
    "IdeaId" uuid,
    "ReportId" uuid
);


--
-- Name: COLUMN "IdeaReports"."ideaId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."IdeaReports"."ideaId" IS 'Id of the idea which the Report belongs to.';


--
-- Name: COLUMN "IdeaReports"."reportId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."IdeaReports"."reportId" IS 'Which Report belongs to the Idea';


--
-- Name: IdeaVotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IdeaVotes" (
    "ideaId" uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    value integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "IdeaVotes"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."IdeaVotes"."creatorId" IS 'User ID of the voter';


--
-- Name: COLUMN "IdeaVotes".value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."IdeaVotes".value IS 'Vote value. Numeric, can be negative on down-vote.';


--
-- Name: Ideas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ideas" (
    id uuid NOT NULL,
    "ideationId" uuid NOT NULL,
    "authorId" uuid NOT NULL,
    statement character varying(2048) NOT NULL,
    description text NOT NULL,
    "imageUrl" text,
    "deletedById" uuid,
    "deletedReasonType" public."enum_Ideas_deletedReasonType",
    "deletedReasonText" character varying(2048),
    "deletedByReportId" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Ideas"."ideationId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas"."ideationId" IS 'To what ideation the idea belongs to';


--
-- Name: COLUMN "Ideas"."authorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas"."authorId" IS 'Author of the idea';


--
-- Name: COLUMN "Ideas".statement; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas".statement IS 'Main idea statement';


--
-- Name: COLUMN "Ideas".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas".description IS 'Idea description';


--
-- Name: COLUMN "Ideas"."imageUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas"."imageUrl" IS 'Image for the idea';


--
-- Name: COLUMN "Ideas"."deletedById"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas"."deletedById" IS 'User ID of the person who deleted the Comment';


--
-- Name: COLUMN "Ideas"."deletedReasonType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas"."deletedReasonType" IS 'Delete reason type which is provided in case deleted by moderator due to a user report';


--
-- Name: COLUMN "Ideas"."deletedReasonText"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas"."deletedReasonText" IS 'Free text with reason why the comment was deleted';


--
-- Name: COLUMN "Ideas"."deletedByReportId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideas"."deletedByReportId" IS 'Report ID due to which comment was deleted';


--
-- Name: Ideations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ideations" (
    id uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    question character varying(2048),
    deadline timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Ideations"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideations"."creatorId" IS 'User who created the ideation.';


--
-- Name: COLUMN "Ideations".question; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideations".question IS 'Question the ideation is gathering ideas for';


--
-- Name: COLUMN "Ideations".deadline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Ideations".deadline IS 'Deadline for the ideation. If NULL then no deadline at all.';


--
-- Name: Moderators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Moderators" (
    id uuid DEFAULT (md5(((random())::text || (clock_timestamp())::text)))::uuid NOT NULL,
    "userId" uuid NOT NULL,
    "partnerId" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Moderators"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Moderators"."userId" IS 'Id of the User of the Moderator';


--
-- Name: COLUMN "Moderators"."partnerId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Moderators"."partnerId" IS 'Which Partner moderator represents. One User can be a moderator of many Partners';


--
-- Name: Partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Partners" (
    id uuid NOT NULL,
    website character varying(255) NOT NULL,
    "redirectUriRegexp" character varying(255) NOT NULL,
    "linkPrivacyPolicy" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Partners".id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Partners".id IS 'Partner id. Open ID client_id.';


--
-- Name: COLUMN "Partners".website; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Partners".website IS 'Partner website';


--
-- Name: COLUMN "Partners"."redirectUriRegexp"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Partners"."redirectUriRegexp" IS 'Partner callback (callback_uri) validation regexp. Also may be used to check request Origin and Referer if present.';


--
-- Name: Reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reports" (
    id uuid NOT NULL,
    type public."enum_Reports_type" NOT NULL,
    text character varying(2048) NOT NULL,
    "creatorId" uuid NOT NULL,
    "creatorIp" character varying(45) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Reports".type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Reports".type IS 'Report reason - verbal abuse, obscene content, hate speech etc..';


--
-- Name: COLUMN "Reports".text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Reports".text IS 'Additional comment for the report to provide more details on the violation.';


--
-- Name: COLUMN "Reports"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Reports"."creatorId" IS 'User ID of the reporter.';


--
-- Name: COLUMN "Reports"."creatorIp"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Reports"."creatorIp" IS 'IP address of the reporter';


--
-- Name: Requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Requests" (
    id uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    "topicId" uuid NOT NULL,
    "groupId" uuid NOT NULL,
    level public."enum_Requests_level" DEFAULT 'read'::public."enum_Requests_level" NOT NULL,
    text character varying(2048),
    type public."enum_Requests_type" NOT NULL,
    "acceptedAt" timestamp with time zone,
    "rejectedAt" timestamp with time zone,
    "actorId" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Requests"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests"."creatorId" IS 'User who created the request.';


--
-- Name: COLUMN "Requests"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests"."topicId" IS 'Topic related to the request';


--
-- Name: COLUMN "Requests"."groupId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests"."groupId" IS 'Group related to the request.';


--
-- Name: COLUMN "Requests".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests".level IS 'Permission level related to the request.';


--
-- Name: COLUMN "Requests".text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests".text IS 'Additional comment for request, or message to the admin.';


--
-- Name: COLUMN "Requests".type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests".type IS 'Type of the request';


--
-- Name: COLUMN "Requests"."acceptedAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests"."acceptedAt" IS 'Request accepting time';


--
-- Name: COLUMN "Requests"."rejectedAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests"."rejectedAt" IS 'Request rejection time';


--
-- Name: COLUMN "Requests"."actorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Requests"."actorId" IS 'User who accepted or rejected the request.';


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: Signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Signatures" (
    id uuid NOT NULL,
    data text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Signatures".id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Signatures".id IS 'Id of the Signature';


--
-- Name: COLUMN "Signatures".data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Signatures".data IS 'Signature xml';


--
-- Name: TokenRevocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TokenRevocations" (
    "tokenId" uuid NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "TokenRevocations"."tokenId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TokenRevocations"."tokenId" IS 'Token Id that has been revoked';


--
-- Name: COLUMN "TokenRevocations"."expiresAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TokenRevocations"."expiresAt" IS 'Token expiration time, after that this entry is not relevant anymore';


--
-- Name: TokenRevocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TokenRevocations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TopicAttachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicAttachments" (
    "topicId" uuid NOT NULL,
    "attachmentId" uuid NOT NULL
);


--
-- Name: COLUMN "TopicAttachments"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicAttachments"."topicId" IS 'To what Topic this Attachment belongs to.';


--
-- Name: COLUMN "TopicAttachments"."attachmentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicAttachments"."attachmentId" IS 'Which Attachment belongs to this Topic.';


--
-- Name: TopicComments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicComments" (
    "topicId" uuid NOT NULL,
    "commentId" uuid NOT NULL
);


--
-- Name: COLUMN "TopicComments"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicComments"."topicId" IS 'To what Topic this Comment belongs to.';


--
-- Name: COLUMN "TopicComments"."commentId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicComments"."commentId" IS 'Which Comment belongs to this Topic.';


--
-- Name: TopicDiscussions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicDiscussions" (
    "topicId" uuid NOT NULL,
    "discussionId" uuid NOT NULL
);


--
-- Name: COLUMN "TopicDiscussions"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicDiscussions"."topicId" IS 'To what Topic this discussion belongs to.';


--
-- Name: COLUMN "TopicDiscussions"."discussionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicDiscussions"."discussionId" IS 'Discussion id.';


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
-- Name: COLUMN "TopicEvents".id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicEvents".id IS 'Event id';


--
-- Name: COLUMN "TopicEvents"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicEvents"."topicId" IS 'To what Topic this Comment belongs to.';


--
-- Name: COLUMN "TopicEvents".subject; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicEvents".subject IS 'Subject of the Event.';


--
-- Name: COLUMN "TopicEvents".text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicEvents".text IS 'Text of the Event.';


--
-- Name: TopicFavourites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicFavourites" (
    "topicId" uuid NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: COLUMN "TopicFavourites"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicFavourites"."topicId" IS 'To what Topic this Pin belongs to.';


--
-- Name: COLUMN "TopicFavourites"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicFavourites"."userId" IS 'Which User this Pin belongs to.';


--
-- Name: TopicIdeations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicIdeations" (
    "topicId" uuid NOT NULL,
    "ideationId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "TopicIdeations"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicIdeations"."topicId" IS 'To what Topic this Ideation belongs to.';


--
-- Name: COLUMN "TopicIdeations"."ideationId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicIdeations"."ideationId" IS 'Ideation id.';


--
-- Name: TopicInviteUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicInviteUsers" (
    "userId" uuid NOT NULL,
    id uuid NOT NULL,
    "creatorId" uuid NOT NULL,
    "expiresAt" timestamp with time zone,
    "topicId" uuid NOT NULL,
    level public."enum_TopicInviteUsers_level" DEFAULT 'read'::public."enum_TopicInviteUsers_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "TopicInviteUsers"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers"."userId" IS 'User who is invited.';


--
-- Name: COLUMN "TopicInviteUsers"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers"."creatorId" IS 'User who created the invite.';


--
-- Name: COLUMN "TopicInviteUsers"."expiresAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers"."expiresAt" IS 'Invite expiration time.';


--
-- Name: COLUMN "TopicInviteUsers"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers"."topicId" IS 'Topic to which member belongs.';


--
-- Name: COLUMN "TopicInviteUsers".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicInviteUsers".level IS 'User membership level.';


--
-- Name: TopicJoins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicJoins" (
    "topicId" uuid NOT NULL,
    token character varying(12) NOT NULL,
    level public."enum_TopicJoins_level" DEFAULT 'read'::public."enum_TopicJoins_level" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "TopicJoins"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicJoins"."topicId" IS 'Topic to which the Join information belongs.';


--
-- Name: COLUMN "TopicJoins".token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicJoins".token IS 'Token for joining the Topic. Used for sharing public urls for Users to join the Topic.';


--
-- Name: COLUMN "TopicJoins".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicJoins".level IS 'Join level, that is what level access will the join token provide';


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
-- Name: COLUMN "TopicMemberGroups"."groupId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicMemberGroups"."groupId" IS 'Group to whom the membership was given.';


--
-- Name: COLUMN "TopicMemberGroups"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicMemberGroups"."topicId" IS 'Topic to which member belongs.';


--
-- Name: COLUMN "TopicMemberGroups".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicMemberGroups".level IS 'User membership level.';


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
-- Name: COLUMN "TopicMemberUsers"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicMemberUsers"."userId" IS 'User whom the membership was given.';


--
-- Name: COLUMN "TopicMemberUsers"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicMemberUsers"."topicId" IS 'Topic to which member belongs.';


--
-- Name: COLUMN "TopicMemberUsers".level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicMemberUsers".level IS 'User membership level.';


--
-- Name: TopicPins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicPins" (
    "topicId" uuid NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: COLUMN "TopicPins"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicPins"."topicId" IS 'To what Topic this Pin belongs to.';


--
-- Name: COLUMN "TopicPins"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicPins"."userId" IS 'Which User this Pin belongs to.';


--
-- Name: TopicReports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicReports" (
    "topicId" uuid NOT NULL,
    "moderatedById" uuid,
    "moderatedAt" timestamp with time zone,
    "moderatedReasonType" public."enum_TopicReports_moderatedReasonType",
    "moderatedReasonText" character varying(2048),
    "resolvedById" uuid,
    "resolvedAt" timestamp with time zone,
    id uuid NOT NULL,
    type public."enum_TopicReports_type" NOT NULL,
    text character varying(2048) NOT NULL,
    "creatorId" uuid NOT NULL,
    "creatorIp" character varying(45) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


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
-- Name: COLUMN "TopicVotes"."topicId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicVotes"."topicId" IS 'To what Topic this Vote belongs to.';


--
-- Name: COLUMN "TopicVotes"."voteId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."TopicVotes"."voteId" IS 'Which Vote belongs to this Topic.';


--
-- Name: Topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Topics" (
    id uuid NOT NULL,
    title character varying(500),
    intro character varying(255),
    description text,
    status public."enum_Topics_status" DEFAULT 'draft'::public."enum_Topics_status" NOT NULL,
    "imageUrl" character varying(255),
    visibility public."enum_Topics_visibility" DEFAULT 'private'::public."enum_Topics_visibility" NOT NULL,
    categories character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "sourcePartnerId" uuid,
    "sourcePartnerObjectId" character varying(255),
    "creatorId" uuid NOT NULL,
    "padUrl" character varying(255) NOT NULL,
    "endsAt" timestamp with time zone,
    country character varying(255),
    language character varying(255),
    contact character varying(255),
    hashtag character varying(60) DEFAULT NULL::character varying,
    "authorIds" uuid[] DEFAULT ARRAY[]::uuid[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Topics".title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".title IS 'Title of the Topic.';


--
-- Name: COLUMN "Topics".intro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".intro IS 'Topic introduction text';


--
-- Name: COLUMN "Topics".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".description IS 'Short description of what the Topic is about.';


--
-- Name: COLUMN "Topics".status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".status IS 'Topic statuses.';


--
-- Name: COLUMN "Topics"."imageUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics"."imageUrl" IS 'Topic header image url.';


--
-- Name: COLUMN "Topics".visibility; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".visibility IS 'Who can see (read) the Topic apart from the Members.';


--
-- Name: COLUMN "Topics"."sourcePartnerId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics"."sourcePartnerId" IS 'The Partner id of the site from which the Topic was created';


--
-- Name: COLUMN "Topics"."sourcePartnerObjectId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics"."sourcePartnerObjectId" IS 'The Partner object/entity id for mapping';


--
-- Name: COLUMN "Topics"."creatorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics"."creatorId" IS 'User ID of the creator of the Topic.';


--
-- Name: COLUMN "Topics"."padUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics"."padUrl" IS 'Etherpad Pad absolute url.';


--
-- Name: COLUMN "Topics"."endsAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics"."endsAt" IS 'Deadline for the Topic. If NULL then no deadline at all.';


--
-- Name: COLUMN "Topics".country; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".country IS 'Topic location country';


--
-- Name: COLUMN "Topics".language; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".language IS 'Topic language';


--
-- Name: COLUMN "Topics".contact; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".contact IS 'Topic contact address or phone';


--
-- Name: COLUMN "Topics".hashtag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Topics".hashtag IS 'Hashtag to search related content from external sources.';


--
-- Name: UserConnections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserConnections" (
    "userId" uuid NOT NULL,
    "connectionId" public."enum_UserConnections_connectionId" NOT NULL,
    "connectionUserId" character varying(255) NOT NULL,
    "connectionData" jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "UserConnections"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserConnections"."userId" IS 'Id of the User whom the connection belongs to.';


--
-- Name: COLUMN "UserConnections"."connectionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserConnections"."connectionId" IS 'User connection identificator.';


--
-- Name: COLUMN "UserConnections"."connectionUserId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserConnections"."connectionUserId" IS 'User id in the connected system. For Facebook their user id, for Google their user id and so on, PID for Estonian ID infra etc.';


--
-- Name: COLUMN "UserConnections"."connectionData"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserConnections"."connectionData" IS 'Connection specific data you want to store.';


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
-- Name: COLUMN "UserConsents"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserConsents"."userId" IS 'Id of the User whom the connection belongs to.';


--
-- Name: COLUMN "UserConsents"."partnerId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserConsents"."partnerId" IS 'Partner id (client_id).';


--
-- Name: UserNewsletters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserNewsletters" (
    "userId" uuid NOT NULL,
    "newsletterName" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "UserNewsletters"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserNewsletters"."userId" IS 'User whom the newsletter was sent.';


--
-- Name: COLUMN "UserNewsletters"."newsletterName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserNewsletters"."newsletterName" IS 'Name of the template for the newsletter';


--
-- Name: UserNotificationSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserNotificationSettings" (
    id integer NOT NULL,
    "userId" uuid NOT NULL,
    "topicId" uuid,
    "groupId" uuid,
    "allowNotifications" boolean,
    preferences json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "UserNotificationSettings"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserNotificationSettings"."userId" IS 'Id of the User whom the connection belongs to.';


--
-- Name: COLUMN "UserNotificationSettings".preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."UserNotificationSettings".preferences IS 'Notification pecific data you want to store.';


--
-- Name: UserNotificationSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."UserNotificationSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: UserNotificationSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."UserNotificationSettings_id_seq" OWNED BY public."UserNotificationSettings".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users" (
    id uuid NOT NULL,
    name character varying(255),
    company character varying(255),
    language character varying(5) DEFAULT 'en'::character varying,
    email character varying(254),
    password character varying(64),
    "passwordResetCode" uuid,
    "emailIsVerified" boolean DEFAULT false NOT NULL,
    "emailVerificationCode" uuid NOT NULL,
    source public."enum_Users_source" NOT NULL,
    "sourceId" character varying(255),
    "imageUrl" character varying(255),
    "termsVersion" character varying(255),
    "termsAcceptedAt" timestamp with time zone,
    "authorId" character varying(255),
    preferences jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Users".name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users".name IS 'Full name of the user.';


--
-- Name: COLUMN "Users".company; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users".company IS 'Company name.';


--
-- Name: COLUMN "Users".language; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users".language IS 'Language code.';


--
-- Name: COLUMN "Users".email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users".email IS 'User registration email.';


--
-- Name: COLUMN "Users".password; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users".password IS 'Password hash. NULL if User was created on invitation OR with another method like ESTEID, FB, Google.';


--
-- Name: COLUMN "Users"."emailIsVerified"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."emailIsVerified" IS 'Flag indicating if e-mail verification has been completed.';


--
-- Name: COLUMN "Users"."emailVerificationCode"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."emailVerificationCode" IS 'E-mail verification code that is sent out with e-mail as a link.';


--
-- Name: COLUMN "Users".source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users".source IS 'User creation source.';


--
-- Name: COLUMN "Users"."sourceId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."sourceId" IS 'User id in the source system. For Facebook their user id, for Google their user id and so on. Null is allowed as there is not point for CitizenOS to provide one.';


--
-- Name: COLUMN "Users"."imageUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."imageUrl" IS 'User profile image url.';


--
-- Name: COLUMN "Users"."termsVersion"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."termsVersion" IS 'Version identifier of user terms accepted by user';


--
-- Name: COLUMN "Users"."termsAcceptedAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."termsAcceptedAt" IS 'Time when the terms were accepted';


--
-- Name: COLUMN "Users"."authorId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users"."authorId" IS 'Etherpad authorID for the user';


--
-- Name: COLUMN "Users".preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Users".preferences IS 'User preferences JSON object';


--
-- Name: VoteContainerFiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteContainerFiles" (
    id uuid NOT NULL,
    "voteId" uuid NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "mimeType" character varying(255) NOT NULL,
    content bytea NOT NULL,
    hash character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "VoteContainerFiles"."voteId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteContainerFiles"."voteId" IS 'To what Vote these files belong to.';


--
-- Name: COLUMN "VoteContainerFiles"."fileName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteContainerFiles"."fileName" IS 'File name as it will appear in the BDOC container.';


--
-- Name: COLUMN "VoteContainerFiles"."mimeType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteContainerFiles"."mimeType" IS 'Mime type of the file.';


--
-- Name: COLUMN "VoteContainerFiles".content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteContainerFiles".content IS 'File content.';


--
-- Name: COLUMN "VoteContainerFiles".hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteContainerFiles".hash IS 'File hash';


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
-- Name: COLUMN "VoteDelegations"."voteId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteDelegations"."voteId" IS 'To what Vote the delegation applies.';


--
-- Name: COLUMN "VoteDelegations"."toUserId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteDelegations"."toUserId" IS 'To which User the Vote was delegated.';


--
-- Name: COLUMN "VoteDelegations"."byUserId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteDelegations"."byUserId" IS 'The User who delegated the Vote.';


--
-- Name: VoteDelegations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."VoteDelegations_id_seq"
    AS integer
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
    "userHash" character varying(64),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "VoteLists"."voteId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteLists"."voteId" IS 'To what Vote this option belongs to.';


--
-- Name: COLUMN "VoteLists"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteLists"."userId" IS 'Id of the User Who cast the Vote.';


--
-- Name: COLUMN "VoteLists"."optionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteLists"."optionId" IS 'The VoteOption selected by the voter.';


--
-- Name: COLUMN "VoteLists"."optionGroupId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteLists"."optionGroupId" IS 'To recognise which votes were given in the same request needed to adequately count votes later.';


--
-- Name: COLUMN "VoteLists"."userHash"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteLists"."userHash" IS 'Hash from users PID that allows filtering votes from different users, but same person';


--
-- Name: VoteLists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."VoteLists_id_seq"
    AS integer
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
    value character varying(200) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "VoteOptions"."voteId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteOptions"."voteId" IS 'To what Vote this option belongs to.';


--
-- Name: COLUMN "VoteOptions".value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteOptions".value IS 'Option value shown to the voter.';


--
-- Name: VoteUserContainers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoteUserContainers" (
    "userId" uuid NOT NULL,
    "voteId" uuid NOT NULL,
    container bytea NOT NULL,
    "PID" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "VoteUserContainers"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteUserContainers"."userId" IS 'Id of the User Who cast the Vote.';


--
-- Name: COLUMN "VoteUserContainers"."voteId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteUserContainers"."voteId" IS 'To what Vote this signed container belongs to.';


--
-- Name: COLUMN "VoteUserContainers".container; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteUserContainers".container IS 'BDOC containing the signed vote.';


--
-- Name: COLUMN "VoteUserContainers"."PID"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."VoteUserContainers"."PID" IS 'User personal ID';


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
    "authType" public."enum_Votes_authType" DEFAULT 'soft'::public."enum_Votes_authType" NOT NULL,
    "autoClose" jsonb[] DEFAULT ARRAY[]::jsonb[],
    "reminderSent" timestamp with time zone,
    "reminderTime" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: COLUMN "Votes"."minChoices"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes"."minChoices" IS 'Minimum number of choices a Voter has to choose when voting.';


--
-- Name: COLUMN "Votes"."maxChoices"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes"."maxChoices" IS 'Maximum number of choices a Voter can choose when voting.';


--
-- Name: COLUMN "Votes"."delegationIsAllowed"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes"."delegationIsAllowed" IS 'Flag indicating if vote delegation is allowed.';


--
-- Name: COLUMN "Votes"."endsAt"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes"."endsAt" IS 'Deadline when voting closes. If NULL then no deadline at all.';


--
-- Name: COLUMN "Votes".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes".description IS 'Vote description.';


--
-- Name: COLUMN "Votes".type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes".type IS 'Vote type. Used to decide visual layout.';


--
-- Name: COLUMN "Votes"."authType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes"."authType" IS 'Authorization types. Soft - user has to be logged in to Vote. Hard - user has to digitally sign a vote.';


--
-- Name: COLUMN "Votes"."reminderSent"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes"."reminderSent" IS 'Time when reminder to vote was sent out';


--
-- Name: COLUMN "Votes"."reminderTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Votes"."reminderTime" IS 'Time when reminder to vote will be sent';


--
-- Name: store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store (
    key character varying(100) NOT NULL,
    value text NOT NULL
);


--
-- Name: UserNotificationSettings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserNotificationSettings" ALTER COLUMN id SET DEFAULT nextval('public."UserNotificationSettings_id_seq"'::regclass);


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
-- Name: DiscussionComments DiscussionComments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscussionComments"
    ADD CONSTRAINT "DiscussionComments_pkey" PRIMARY KEY ("discussionId", "commentId");


--
-- Name: Discussions Discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- Name: FolderIdeas FolderIdeas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FolderIdeas"
    ADD CONSTRAINT "FolderIdeas_pkey" PRIMARY KEY ("folderId", "ideaId");


--
-- Name: Folders Folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Folders"
    ADD CONSTRAINT "Folders_pkey" PRIMARY KEY (id);


--
-- Name: GroupFavourites GroupFavourites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupFavourites"
    ADD CONSTRAINT "GroupFavourites_pkey" PRIMARY KEY ("groupId", "userId");


--
-- Name: GroupInviteUsers GroupInviteUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupInviteUsers"
    ADD CONSTRAINT "GroupInviteUsers_pkey" PRIMARY KEY (id, "groupId");


--
-- Name: GroupJoins GroupJoins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupJoins"
    ADD CONSTRAINT "GroupJoins_pkey" PRIMARY KEY ("groupId");


--
-- Name: GroupJoins GroupJoins_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupJoins"
    ADD CONSTRAINT "GroupJoins_token_key" UNIQUE (token);


--
-- Name: GroupMemberUsers GroupMemberUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupMemberUsers"
    ADD CONSTRAINT "GroupMemberUsers_pkey" PRIMARY KEY ("userId", "groupId");


--
-- Name: Groups Groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: IdeaComments IdeaComments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaComments"
    ADD CONSTRAINT "IdeaComments_pkey" PRIMARY KEY ("ideaId", "commentId");


--
-- Name: IdeaFavourites IdeaFavourites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaFavourites"
    ADD CONSTRAINT "IdeaFavourites_pkey" PRIMARY KEY ("ideaId", "userId");


--
-- Name: IdeaReports IdeaReports_IdeaId_ReportId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaReports"
    ADD CONSTRAINT "IdeaReports_IdeaId_ReportId_key" UNIQUE ("IdeaId", "ReportId");


--
-- Name: IdeaReports IdeaReports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaReports"
    ADD CONSTRAINT "IdeaReports_pkey" PRIMARY KEY ("ideaId", "reportId");


--
-- Name: IdeaVotes IdeaVotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaVotes"
    ADD CONSTRAINT "IdeaVotes_pkey" PRIMARY KEY ("ideaId", "creatorId");


--
-- Name: Ideas Ideas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ideas"
    ADD CONSTRAINT "Ideas_pkey" PRIMARY KEY (id);


--
-- Name: Ideations Ideations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ideations"
    ADD CONSTRAINT "Ideations_pkey" PRIMARY KEY (id);


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
-- Name: Requests Requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Requests"
    ADD CONSTRAINT "Requests_pkey" PRIMARY KEY (id, "creatorId", "topicId", "groupId");


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: Signatures Signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Signatures"
    ADD CONSTRAINT "Signatures_pkey" PRIMARY KEY (id);


--
-- Name: TokenRevocations TokenRevocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TokenRevocations"
    ADD CONSTRAINT "TokenRevocations_pkey" PRIMARY KEY ("tokenId");


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
-- Name: TopicDiscussions TopicDiscussions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicDiscussions"
    ADD CONSTRAINT "TopicDiscussions_pkey" PRIMARY KEY ("topicId", "discussionId");


--
-- Name: TopicEvents TopicEvents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicEvents"
    ADD CONSTRAINT "TopicEvents_pkey" PRIMARY KEY (id);


--
-- Name: TopicFavourites TopicFavourites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicFavourites"
    ADD CONSTRAINT "TopicFavourites_pkey" PRIMARY KEY ("topicId", "userId");


--
-- Name: TopicIdeations TopicIdeations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicIdeations"
    ADD CONSTRAINT "TopicIdeations_pkey" PRIMARY KEY ("topicId", "ideationId");


--
-- Name: TopicInviteUsers TopicInviteUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_pkey" PRIMARY KEY (id, "topicId");


--
-- Name: TopicJoins TopicJoins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicJoins"
    ADD CONSTRAINT "TopicJoins_pkey" PRIMARY KEY ("topicId");


--
-- Name: TopicJoins TopicJoins_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicJoins"
    ADD CONSTRAINT "TopicJoins_token_key" UNIQUE (token);


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
-- Name: TopicPins TopicPins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicPins"
    ADD CONSTRAINT "TopicPins_pkey" PRIMARY KEY ("topicId", "userId");


--
-- Name: TopicReports TopicReports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicReports"
    ADD CONSTRAINT "TopicReports_pkey" PRIMARY KEY ("topicId", id);


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
-- Name: UserNewsletters UserNewsletters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserNewsletters"
    ADD CONSTRAINT "UserNewsletters_pkey" PRIMARY KEY ("userId", "newsletterName");


--
-- Name: UserNotificationSettings UserNotificationSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserNotificationSettings"
    ADD CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY (id);


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
    ADD CONSTRAINT "VoteUserContainers_pkey" PRIMARY KEY ("voteId", "PID");


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
-- Name: user_notification_settings_user_id_topic_id_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_notification_settings_user_id_topic_id_group_id ON public."UserNotificationSettings" USING btree ("userId", "topicId", "groupId");


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
-- Name: DiscussionComments DiscussionComments_discussionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscussionComments"
    ADD CONSTRAINT "DiscussionComments_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES public."Discussions"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FolderIdeas FolderIdeas_folderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FolderIdeas"
    ADD CONSTRAINT "FolderIdeas_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES public."Folders"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FolderIdeas FolderIdeas_ideaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FolderIdeas"
    ADD CONSTRAINT "FolderIdeas_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES public."Ideas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Folders Folders_ideationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Folders"
    ADD CONSTRAINT "Folders_ideationId_fkey" FOREIGN KEY ("ideationId") REFERENCES public."Ideations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupFavourites GroupFavourites_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupFavourites"
    ADD CONSTRAINT "GroupFavourites_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupFavourites GroupFavourites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupFavourites"
    ADD CONSTRAINT "GroupFavourites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupInviteUsers GroupInviteUsers_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupInviteUsers"
    ADD CONSTRAINT "GroupInviteUsers_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupInviteUsers GroupInviteUsers_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupInviteUsers"
    ADD CONSTRAINT "GroupInviteUsers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupInviteUsers GroupInviteUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupInviteUsers"
    ADD CONSTRAINT "GroupInviteUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupJoins GroupJoins_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupJoins"
    ADD CONSTRAINT "GroupJoins_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupMemberUsers GroupMemberUsers_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupMemberUsers"
    ADD CONSTRAINT "GroupMemberUsers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupMemberUsers GroupMemberUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GroupMemberUsers"
    ADD CONSTRAINT "GroupMemberUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: IdeaComments IdeaComments_ideaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaComments"
    ADD CONSTRAINT "IdeaComments_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES public."Ideas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IdeaFavourites IdeaFavourites_ideaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaFavourites"
    ADD CONSTRAINT "IdeaFavourites_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES public."Ideas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IdeaReports IdeaReports_IdeaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaReports"
    ADD CONSTRAINT "IdeaReports_IdeaId_fkey" FOREIGN KEY ("IdeaId") REFERENCES public."Ideas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IdeaReports IdeaReports_ideaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaReports"
    ADD CONSTRAINT "IdeaReports_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES public."Ideas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IdeaVotes IdeaVotes_ideaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdeaVotes"
    ADD CONSTRAINT "IdeaVotes_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES public."Ideas"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ideas Ideas_ideationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ideas"
    ADD CONSTRAINT "Ideas_ideationId_fkey" FOREIGN KEY ("ideationId") REFERENCES public."Ideations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: Requests Requests_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Requests"
    ADD CONSTRAINT "Requests_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Requests Requests_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Requests"
    ADD CONSTRAINT "Requests_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Requests Requests_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Requests"
    ADD CONSTRAINT "Requests_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Requests Requests_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Requests"
    ADD CONSTRAINT "Requests_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: TopicDiscussions TopicDiscussions_discussionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicDiscussions"
    ADD CONSTRAINT "TopicDiscussions_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES public."Discussions"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicEvents TopicEvents_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicEvents"
    ADD CONSTRAINT "TopicEvents_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicFavourites TopicFavourites_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicFavourites"
    ADD CONSTRAINT "TopicFavourites_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicFavourites TopicFavourites_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicFavourites"
    ADD CONSTRAINT "TopicFavourites_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicIdeations TopicIdeations_ideationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicIdeations"
    ADD CONSTRAINT "TopicIdeations_ideationId_fkey" FOREIGN KEY ("ideationId") REFERENCES public."Ideations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicInviteUsers TopicInviteUsers_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicInviteUsers TopicInviteUsers_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicInviteUsers TopicInviteUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicInviteUsers"
    ADD CONSTRAINT "TopicInviteUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TopicJoins TopicJoins_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicJoins"
    ADD CONSTRAINT "TopicJoins_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
    ADD CONSTRAINT "TopicReports_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: UserNewsletters UserNewsletters_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserNewsletters"
    ADD CONSTRAINT "UserNewsletters_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserNotificationSettings UserNotificationSettings_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserNotificationSettings"
    ADD CONSTRAINT "UserNotificationSettings_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Groups"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserNotificationSettings UserNotificationSettings_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserNotificationSettings"
    ADD CONSTRAINT "UserNotificationSettings_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserNotificationSettings UserNotificationSettings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserNotificationSettings"
    ADD CONSTRAINT "UserNotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
20190616115724-alter-user-accpet-terms.js
20190627132611-alter-partner-terms-link.js
20191119124917-create-topic-invite-user.js
20191218091941-update-vote-option-max-value.js
20200130121507-create-signature.js
202002192021-alter-user-connection.js
20200225152502-remove-vote-user-container-activity.js
202010261616-alter-user-add-auhorID.js
20210310104918-create-group-invite-user.js
202103251231-alter-vote-lists-add-userhash.js
20210329141948-alter-vote-user-containers.js
20210510112610-groupmember_to_groupmemberusers.js
202106111127-alter-relations-add-on-cascade.js
20210722084618-alter-vote-add-auto-close.js
20211008104906-create-topic-join.js
20211008193321-alter-user-add-preferences.js
20211028142538-create-group-join.js
20211209091354-create-token-revocation.js
20211217120934-comment-type-poi.js
20220203120245-users-password-comment.js
20220228174313-duplicate-email-users-issue-234.js
20220405120631-create-user-notification-settings.js
20220520100104-add-vote-reminder.js
20220808083309-alter_group.js
20220816103332-alter-topic-invite-user.js
20220816103355-alter-group-invite-user.js
20231020153809-alter-group-add-location.js
20231020154400-alter-topic-add-location.js
20231025094913-alter-topic-add-intro.js
20231027115040-rename-topic-pin-group-pin.js
20231117225849-alter_topic_add_imageurl.js
20231206200052-topic_status_draft.js
20240306104617-alter-user-connection.js
20240306104859-alter-vote-autoclose.js
20240325115611-user-newsletter.js
20240326102945-create-request.js
20240405170424-create-ideation.js
20240618064610-create-discussion.js
20240702054643-alter-vote-container-files.js
\.
